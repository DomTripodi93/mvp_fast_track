import { Directive, ElementRef, Renderer2, HostListener, OnInit, Input, EventEmitter, Output } from '@angular/core';

@Directive({
    selector: '[appResizableColumn]'
})
export class ResizableColumnDirective implements OnInit {
    @Input() isSticky: boolean = false;
    @Input() columnWidth!: string;
    @Output() setColumnWidth: EventEmitter<string> = new EventEmitter<string>();  // Add this input to the directive

    private startX: number = 0;
    private startWidth: number = 0;
    private offsetX: number = 23;
    private resizer: HTMLElement | undefined;


    th: any
    table: any
    headerRow: any
    columnIndex: number = 0;

    constructor(
        private el: ElementRef,
        private renderer: Renderer2
    ) { }

    ngOnInit() {
        // console.log(this.columnWidth);
        this.startWidth = this.columnWidth.replace("px", "") as unknown as number;

        this.th = this.el.nativeElement;
        this.table = this.th.closest('table');
        this.headerRow = this.th.parentElement;
        this.columnIndex = Array.from(this.headerRow.children).indexOf(this.th);

        if (this.isSticky) {
            this.renderer.setStyle(this.th, 'position', 'sticky');
        } else {
            this.renderer.setStyle(this.th, 'position', 'relative');
        }

        this.resizer = this.renderer.createElement('span');
        this.renderer.setStyle(this.resizer, 'position', 'absolute');
        this.renderer.setStyle(this.resizer, 'right', '0');
        this.renderer.setStyle(this.resizer, 'top', '0');
        this.renderer.setStyle(this.resizer, 'height', '100%');
        this.renderer.setStyle(this.resizer, 'width', '5px');
        this.renderer.setStyle(this.resizer, 'cursor', 'col-resize');
        this.renderer.setStyle(this.resizer, 'user-select', 'none');

        this.renderer.appendChild(this.th, this.resizer);

        this.renderer.listen(this.resizer, 'mousedown', this.onMouseDown.bind(this));
    }

    onMouseDown(event: MouseEvent) {
        event.preventDefault();

        this.startX = event.pageX;
        this.startWidth = this.th.offsetWidth;

        const mouseMoveListener = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
            const newWidth = this.startWidth + (e.pageX - this.startX) - this.offsetX;
            if (newWidth > 30) {
                this.setWidth(newWidth + "px");
            }
            this.setColumnWidth.emit(newWidth + "px");
        });

        const mouseUpListener = this.renderer.listen('document', 'mouseup', () => {
            mouseMoveListener();
            mouseUpListener();
        });
    }

    setWidth(newWidth: string) {
        this.renderer.setStyle(this.th, 'width', newWidth);
        this.renderer.setStyle(this.th, 'min-width', newWidth);
        this.renderer.setStyle(this.th, 'max-width', newWidth);

        // Resize all detail cells in this column
        const rows = Array.from(this.table.querySelectorAll('tbody tr'));
        rows.forEach((row: any) => {
            const cell = row.children[this.columnIndex] as HTMLElement;
            if (cell) {
                this.renderer.setStyle(cell, 'width', newWidth);
                this.renderer.setStyle(cell, 'min-width', newWidth);
                this.renderer.setStyle(cell, 'max-width', newWidth);
            }
        });

        this.setColumnWidth.emit(newWidth);
    }


}
