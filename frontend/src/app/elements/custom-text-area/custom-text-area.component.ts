import { NgClass } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
    selector: 'app-custom-text-area',
    imports: [
        NgClass,
        FormsModule,
        LoadingSpinnerComponent
    ],
    templateUrl: './custom-text-area.component.html',
    styleUrl: './custom-text-area.component.css'
})
export class CustomTextAreaComponent implements AfterViewInit {
    @Input() label: string = "";
    @Input() placeholder: string = '';
    @Input() value: string = '';
    @Input() disabled: boolean = false;
    @Input() softDisabled: boolean = false;
    @Input() required: boolean = false;
    @Input() iconStart: string = "";
    @Input() iconEnd: string = "";
    @Input() loading: boolean = false;
    @Input() boxShadow: boolean = true;
    @Input() minHeight: string = '150px';
    @Input() showToolbar: boolean = false;
    @Input() showSourceToggle: boolean = false;

    @Output() valueChange = new EventEmitter<string>();
    @Output() onValueChanged = new EventEmitter<string>();
    @Output() onEnter = new EventEmitter<void>();
    @Output() iconEndClick = new EventEmitter<string>();
    @Output() iconStartClick = new EventEmitter<string>();
    @Output() valueChangeDefault = new EventEmitter<string>();

    @ViewChild("editor") editor!: ElementRef<HTMLDivElement>;
    @ViewChild("sourceEditor") sourceEditor!: ElementRef<HTMLTextAreaElement>;

    urlRegex = /(https?:\/\/[^\s]+)/g;
    fontConversion: Record<string, number> = {
        "10px": 1,
        "13px": 2,
        "16px": 3,
        "18px": 4,
        "24px": 5,
        "32px": 6,
        "48px": 7
    }

    showSource: boolean = false;
    sourceValue: string = '';
    savedSelection: Range | null = null;
    lastCreatedLink: HTMLAnchorElement | null = null;
    firstLinkUrl: string | null = null;
    firstLinkPreviewImage: string | null = null;
    firstLinkTitle: string | null = null;
    firstLinkDescription: string | null = null;
    showLinkImage: boolean = true;

    ngAfterViewInit(): void {
        if (this.editor) {
            // Set initial content if provided
            if (this.value) {
                this.editor.nativeElement.innerHTML = this.value;
                this.sourceValue = this.value;
            }

            // Set default font size for the editor and listen for keydown events
            this.editor.nativeElement.style.fontSize = '16px';

            // Add keydown listener to handle Enter key
            this.editor.nativeElement.addEventListener('keydown', (e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                    this.handleEnterKey(e);
                }
            });
        }
    }

    private handleEnterKey(e: KeyboardEvent): void {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        let element = range.startContainer;

        // Get the parent element if we're in a text node
        if (element.nodeType === Node.TEXT_NODE) {
            element = element.parentElement!;
        }

        // Check if current line has a font tag with explicit size
        let currentFontSize = '3'; // default
        let currentElement: HTMLElement | null = element as HTMLElement;

        while (currentElement && currentElement !== this.editor?.nativeElement) {
            if (currentElement.tagName === 'FONT' && currentElement.hasAttribute('size')) {
                currentFontSize = currentElement.getAttribute('size') || '3';
                break;
            }
            currentElement = currentElement.parentElement;
        }

        // If no explicit font tag was found, we're at default size
        // Use setTimeout to apply the font size after the new line is created
        setTimeout(() => {
            document.execCommand('fontSize', false, currentFontSize);
        }, 0);
    }

    onInput(event: Event): void {
        const div = event.target as HTMLDivElement;

        // Check if this was a space or if user is still typing
        const inputEvent = event as InputEvent;
        
        // Handle undo - revert the most recent link creation
        if (inputEvent.inputType === 'historyUndo') {
            if (this.lastCreatedLink && div.contains(this.lastCreatedLink)) {
                // Replace the most recent link with plain text
                const textNode = document.createTextNode(this.lastCreatedLink.textContent || '');
                this.lastCreatedLink.parentNode?.replaceChild(textNode, this.lastCreatedLink);
                this.lastCreatedLink = null;
                this.sourceValue = div.innerHTML;
                this.updateFirstLink(div);
                this.emitValue(this.sourceValue);
            }
            return;
        }
        
        const isSpace = inputEvent.data === ' '
            || inputEvent.inputType === 'insertParagraph';

        if (!isSpace) {
            // Not a space, don't process links yet
            // Clear the lastCreatedLink since user is doing something else
                
            this.sourceValue = div.innerHTML;
            this.emitValue(this.sourceValue);
            this.lastCreatedLink = null;
            return;
        }

        // Process links asynchronously to not interfere with cursor
        requestAnimationFrame(() => {
            const selection = window.getSelection();

            if (!selection || selection.rangeCount === 0) {
                // No selection, just process and emit
                const needsProcessing = this.hasUnprocessedLinks(div);
                if (needsProcessing) {
                    this.processLinks(div);
                    this.sourceValue = div.innerHTML;
                    this.emitValue(this.sourceValue);
                }
                // Always update first link, even if no processing needed
                this.updateFirstLink(div);
                return;
            }

            // Save cursor position by calculating character offset
            const range = selection.getRangeAt(0);
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(div);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            const cursorPosition = preCaretRange.toString().length;

            // Check if we need to process any links
            const needsProcessing = this.hasUnprocessedLinks(div);

            if (needsProcessing) {
                const lastLink = this.processLinks(div);
                this.lastCreatedLink = lastLink;

                // Restore cursor by character position
                this.restoreCursorByPosition(div, cursorPosition);

                // Update sourceValue and emit after processing
                this.sourceValue = div.innerHTML;
                this.emitValue(this.sourceValue);
            }
            
            // Always update first link after processing
            this.updateFirstLink(div);
        });
    }

    private async updateFirstLink(div: HTMLDivElement): Promise<void> {
        const firstAnchor = div.querySelector('a');
        const newUrl = firstAnchor ? firstAnchor.href : null;
        
        // Only reset and fetch metadata if the URL changed
        if (newUrl !== this.firstLinkUrl) {
            this.showLinkImage = true;
            this.firstLinkUrl = newUrl;
            this.firstLinkPreviewImage = null;
            this.firstLinkTitle = null;
            this.firstLinkDescription = null;
            
            if (newUrl) {
                await this.fetchLinkMetadata(newUrl);
            }
        } else {
            this.firstLinkUrl = newUrl;
        }
    }
    
    private async fetchLinkMetadata(url: string): Promise<void> {
        try {
            // Fetch the HTML of the URL
            const response = await fetch(url, { mode: 'cors' });
            const html = await response.text();
            
            // Create a temporary DOM to parse the HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Try to get Open Graph image first, then fall back to meta tags
            const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
            const twitterImage = doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
            const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
            const twitterTitle = doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
            const pageTitle = doc.querySelector('title')?.textContent;
            const ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
            const twitterDescription = doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content');
            const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content');
            
            this.firstLinkPreviewImage = ogImage || twitterImage || null;
            this.firstLinkTitle = ogTitle || twitterTitle || pageTitle || null;
            this.firstLinkDescription = ogDescription || twitterDescription || metaDescription || null;
        } catch (error) {
            console.warn('Failed to fetch link metadata:', error);
            // Metadata fetch failed, but we'll still show the link
            this.firstLinkPreviewImage = null;
            this.firstLinkTitle = null;
            this.firstLinkDescription = null;
        }
    }

    private restoreCursorByPosition(element: HTMLElement, targetPosition: number): void {
        const selection = window.getSelection();
        if (!selection) return;

        let currentPosition = 0;

        const findPosition = (node: Node): boolean => {
            if (node.nodeType === Node.TEXT_NODE) {
                const textLength = node.textContent?.length || 0;
                if (currentPosition + textLength >= targetPosition) {
                    const offset = targetPosition - currentPosition;
                    const range = document.createRange();
                    range.setStart(node, Math.min(offset, textLength));
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    return true;
                }
                currentPosition += textLength;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                for (let i = 0; i < node.childNodes.length; i++) {
                    if (findPosition(node.childNodes[i])) {
                        return true;
                    }
                }
            }
            return false;
        };

        if (!findPosition(element)) {
            // Fallback: place cursor at the end
            const range = document.createRange();
            range.selectNodeContents(element);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    onEditorBlur(): void {
        // Process any remaining links when user clicks away
        if (this.editor) {
            const div = this.editor.nativeElement;
            const needsProcessing = this.hasUnprocessedLinks(div);
            if (needsProcessing) {
                const lastLink = this.processLinks(div);
                this.lastCreatedLink = lastLink;
                this.sourceValue = div.innerHTML;
                this.updateFirstLink(div);
                this.emitValue(this.sourceValue);
            }
        }
    }

    private hasUnprocessedLinks(element: HTMLElement): boolean {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null
        );

        let currentNode: Node | null;
        while (currentNode = walker.nextNode()) {
            const text = currentNode.textContent || '';
            this.urlRegex.lastIndex = 0;
            if (this.urlRegex.test(text) && currentNode.parentElement?.tagName !== 'A') {
                return true;
            }
        }
        return false;
    }

    private processLinks(element: HTMLElement): HTMLAnchorElement | null {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null
        );

        const textNodesToProcess: { node: Text; parent: Node; nextSibling: Node | null }[] = [];
        let currentNode: Node | null;

        // Collect text nodes that need processing
        while (currentNode = walker.nextNode()) {
            const text = currentNode.textContent || '';
            // Reset regex before testing
            this.urlRegex.lastIndex = 0;
            if (this.urlRegex.test(text) && currentNode.parentElement?.tagName !== 'A') {
                textNodesToProcess.push({
                    node: currentNode as Text,
                    parent: currentNode.parentNode!,
                    nextSibling: currentNode.nextSibling
                });
            }
        }

        let lastCreatedAnchor: HTMLAnchorElement | null = null;

        // Process collected text nodes
        textNodesToProcess.forEach(({ node, parent, nextSibling }) => {
            const text = node.textContent || '';
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            let match;

            // Reset regex
            this.urlRegex.lastIndex = 0;

            while ((match = this.urlRegex.exec(text)) !== null) {
                // Add text before the URL
                if (match.index > lastIndex) {
                    fragment.appendChild(
                        document.createTextNode(text.substring(lastIndex, match.index))
                    );
                }

                // Create anchor element
                const anchor = document.createElement('a');
                anchor.href = match[0];
                anchor.target = '_blank';
                anchor.rel = 'noopener noreferrer';
                anchor.textContent = match[0];
                fragment.appendChild(anchor);
                lastCreatedAnchor = anchor; // Track the last created anchor

                lastIndex = match.index + match[0].length;
            }

            // Add remaining text after last URL
            if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            }

            // Replace the text node with the fragment if we created links
            if (fragment.childNodes.length > 1 || (fragment.childNodes.length === 1 && fragment.firstChild?.nodeName === 'A')) {
                parent.insertBefore(fragment, nextSibling);
                parent.removeChild(node);
            }
        });

        return lastCreatedAnchor;
    }

    onSourceInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        this.sourceValue = textarea.value;
        this.emitValue(this.sourceValue);
    }

    linkifyText(text: string): string {
        return text.replace(this.urlRegex, (url) => {
            const escaped = url.replace(/"/g, "&quot;"); // basic escape for "
            return '<a style="color: inherit" href="' + escaped + '" target="_blank" rel="noopener noreferrer">' +
                url +
                '</a>';
        });
    }

    toggleSource(): void {
        if (!this.showSource) {
            // Switching to source view
            this.sourceValue = this.editor.nativeElement.innerHTML;
            this.showSource = true;
        } else {
            // Switching back to visual editor
            // this.editor.nativeElement.innerHTML = this.sourceValue;
            this.showSource = false;
            this.emitValue(this.sourceValue);
        }
    }

    execCommand(command: string, value: string | null = null): void {
        if (this.disabled || this.softDisabled) return;

        // Save the selection before executing command
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);

            // For certain commands, ensure we have a proper selection
            if (['fontSize', 'foreColor', 'hiliteColor'].includes(command)) {
                if (range.collapsed) {
                    // No text selected, don't apply
                    this.editor.nativeElement.focus();
                    return;
                }
            }

            // For list commands, preserve font size
            if (['insertUnorderedList', 'insertOrderedList'].includes(command)) {
                // Check if we're already in a list (converting from one list type to another)
                let existingListElement: HTMLElement | null = null;
                let startElement = range.commonAncestorContainer;

                if (startElement.nodeType === Node.TEXT_NODE) {
                    startElement = startElement.parentElement!;
                }

                let checkEl: HTMLElement | null = startElement as HTMLElement;
                while (checkEl && checkEl !== this.editor.nativeElement) {
                    if (checkEl.tagName === 'UL' || checkEl.tagName === 'OL') {
                        existingListElement = checkEl;
                        break;
                    }
                    checkEl = checkEl.parentElement;
                }

                // Get current font size before creating/converting list
                const currentSize = this.getCurrentFontSize();

                // Execute the list command
                document.execCommand(command, false, value || undefined);

                // Re-select the list content and apply the font size
                setTimeout(() => {
                    const newSelection = window.getSelection();
                    if (newSelection && newSelection.rangeCount > 0) {
                        const newRange = newSelection.getRangeAt(0);
                        let listElement = newRange.commonAncestorContainer;

                        if (listElement.nodeType === Node.TEXT_NODE) {
                            listElement = listElement.parentElement!;
                        }

                        // Find the ul or ol element
                        let currentEl: HTMLElement | null = listElement as HTMLElement;
                        while (currentEl && currentEl !== this.editor.nativeElement) {
                            if (currentEl.tagName === 'UL' || currentEl.tagName === 'OL') {
                                // Select all content in the list
                                const listRange = document.createRange();
                                listRange.selectNodeContents(currentEl);
                                newSelection.removeAllRanges();
                                newSelection.addRange(listRange);

                                // Apply the original font size
                                document.execCommand('fontSize', false, currentSize.toString());

                                // Restore cursor position
                                newSelection.removeAllRanges();
                                newSelection.addRange(newRange);
                                break;
                            }
                            currentEl = currentEl.parentElement;
                        }
                    }
                    this.emitValue(this.editor.nativeElement.innerHTML);
                }, 0);

                this.editor.nativeElement.focus();
                return;
            }
        }

        document.execCommand(command, false, value || undefined);
        this.editor.nativeElement.focus();
        this.emitValue(this.editor.nativeElement.innerHTML);
    }

    insertLink(): void {
        const url = prompt('Enter URL:');
        if (url) {
            this.execCommand('createLink', url);
        }
    }

    insertImage(): void {
        const url = prompt('Enter image URL:');
        if (url) {
            this.execCommand('insertImage', url);
        }
    }

    changeColor(type: 'foreColor' | 'hiliteColor', event: Event): void {
        event.preventDefault();
        event.stopPropagation();

        const input = event.target as HTMLInputElement;
        const color = input.value;

        if (color && this.savedSelection) {
            // Restore the saved selection
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(this.savedSelection);

                // Execute the command with the restored selection
                document.execCommand(type, false, color);
                this.emitValue(this.editor.nativeElement.innerHTML);
            }
        }
    }

    onColorPickerClick(): void {
        // Save the current selection when color picker is about to open
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            this.savedSelection = selection.getRangeAt(0).cloneRange();
        }
    }

    increaseFontSize(): void {
        if (this.disabled || this.softDisabled) return;

        // Check if we have a selection first
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) {
            return; // No text selected
        }

        const currentSize = this.getCurrentFontSize();
        const newSize = Math.min(7, currentSize + 1);
        this.execCommand('fontSize', newSize.toString());
    }

    decreaseFontSize(): void {
        if (this.disabled || this.softDisabled) return;

        // Check if we have a selection first
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) {
            return; // No text selected
        }

        const currentSize = this.getCurrentFontSize();
        const newSize = Math.max(1, currentSize - 1);
        this.execCommand('fontSize', newSize.toString());
    }

    private getCurrentFontSize(): number {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return 3;

        const range = selection.getRangeAt(0);

        // Get the first selected element or text node
        let element: HTMLElement;

        if (range.startContainer.nodeType === Node.TEXT_NODE) {
            element = range.startContainer.parentElement!;
        } else {
            element = range.startContainer as HTMLElement;
            // If we're at a container level, try to get the first child element
            if (element.childNodes.length > 0 && range.startOffset < element.childNodes.length) {
                const childNode = element.childNodes[range.startOffset];
                if (childNode.nodeType === Node.TEXT_NODE) {
                    element = childNode.parentElement!;
                } else if (childNode.nodeType === Node.ELEMENT_NODE) {
                    element = childNode as HTMLElement;
                }
            }
        }

        // Try to find a font tag with size first (more specific)
        let currentElement: HTMLElement | null = element;
        while (currentElement && currentElement !== this.editor?.nativeElement) {
            if (currentElement.tagName === 'FONT' && currentElement.hasAttribute('size')) {
                const size = parseInt(currentElement.getAttribute('size') || '3');
                return isNaN(size) ? 3 : size;
            }
            currentElement = currentElement.parentElement;
        }

        // Check if we're in a list item - get the first text node's computed style
        currentElement = element;
        while (currentElement && currentElement !== this.editor?.nativeElement) {
            if (currentElement.tagName === 'LI') {
                // Look for any font tags within the list item
                const fontInLi = currentElement.querySelector('font[size]');
                if (fontInLi) {
                    const size = parseInt(fontInLi.getAttribute('size') || '3');
                    return isNaN(size) ? 3 : size;
                }
                // If no font tag, check the first text node in the list item
                const textNode = this.getFirstTextNode(currentElement);
                if (textNode && textNode.parentElement) {
                    const style = window.getComputedStyle(textNode.parentElement, null);
                    const fontSize = style.getPropertyValue("font-size");
                    if (this.fontConversion[fontSize]) {
                        return this.fontConversion[fontSize];
                    }
                }
                break;
            }
            currentElement = currentElement.parentElement;
        }

        // Fall back to computed style
        const style = window.getComputedStyle(element, null);
        const fontSize = style.getPropertyValue("font-size");

        if (this.fontConversion[fontSize]) {
            return this.fontConversion[fontSize];
        } else {
            const pixels = parseFloat(fontSize);
            return Math.round(pixels / 7.2); // Approximate conversion to font size 1-7
        }
    }

    private getFirstTextNode(element: HTMLElement): Node | null {
        for (let i = 0; i < element.childNodes.length; i++) {
            const node = element.childNodes[i];
            if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
                return node;
            }
            if (node.nodeType === Node.ELEMENT_NODE) {
                const result = this.getFirstTextNode(node as HTMLElement);
                if (result) return result;
            }
        }
        return null;
    }

    private emitValue(html: string): void {
        this.valueChange.emit(html);
        this.valueChangeDefault.emit(html);
        this.onValueChanged.emit(html);
    }

    focus(): void {
        if (this.showSource && this.sourceEditor) {
            this.sourceEditor.nativeElement.focus();
        } else if (this.editor) {
            this.editor.nativeElement.focus();
        }
    }
}
