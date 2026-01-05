import { NgClass, NgStyle } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { CustomButtonComponent } from '../custom-button/custom-button.component';

@Component({
    selector: 'app-custom-upload',
    imports: [
        CustomButtonComponent,
        NgStyle,
        NgClass
    ],
    templateUrl: './custom-upload.component.html',
    styleUrl: './custom-upload.component.css'
})
export class CustomUploadComponent implements OnInit {
    // @Input() value: Date | null = null;
    // @Input() disabled: boolean = false;
    // @Input() softDisabled: boolean = false;
    // @Output() valueChange = new EventEmitter<Date | null>();

    // @Input() label: string = "";
    // @Input() placeholder?: string;
    // @Input() min?: string; // still a string in yyyy-MM-dd
    @Input() width: string = "450px";
    @Input() height: string = "auto";
    @Input() multiSelect: boolean = false;
    @Input() photoOnly: boolean = false;
    @Input() showPreview: boolean = false;
    @Input() allowCancel: boolean = false;
    @Output() onSubmit: EventEmitter<FileList> = new EventEmitter<FileList>();
    @Output() onImageSelected: EventEmitter<string> = new EventEmitter<string>();
    @Output() onCancelUpload: EventEmitter<void> = new EventEmitter<void>();
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;;

    selectedFiles: FileList = new DataTransfer().files;
    imagePreviewUrl: string | null = null;
    isDragOver = false;
    boxStyle: any = {};
    itemStyle: any = {};
    dragNestedCount: number = 0;

    ngOnInit(): void {
        this.itemStyle["width"] = this.width
        this.boxStyle["width"] = this.width
        this.boxStyle["height"] = this.height
    }

    cancelUpload() {
        if (this.fileInput){
            this.fileInput.nativeElement.value = null;
        }
        this.selectedFiles = new DataTransfer().files;
        this.imagePreviewUrl = null;
        this.onCancelUpload.emit();
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files) {
            this.selectedFiles = input.files;
            if (this.photoOnly && input.files.length > 0) {
                this.generateImagePreview(input.files[0]);
            }
        }
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        this.isDragOver = false;
        if (event.dataTransfer?.files && event.dataTransfer.files) {
            if (this.multiSelect) {
                if (this.selectedFiles.length > 0) {
                    let newFiles: any[] = Array.from(event.dataTransfer.files);
                    let oldFiles: any[] = Array.from(this.selectedFiles);
                    let newFileNames: string[] = newFiles.map(newFile => {
                        return newFile.name.toLowerCase()
                    })
                    let dataTransfer = new DataTransfer();

                    let filePromises: Promise<void>[] = [];

                    filePromises.push(new Promise<void>(resolve => {
                        let oldFilesProcessed: number = 0;
                        oldFiles.forEach(oldFile => {
                            if (!newFileNames.includes(oldFile.name.toLowerCase())) {
                                dataTransfer.items.add(oldFile);
                            }
                            oldFilesProcessed++
                            if (oldFilesProcessed === oldFiles.length) {
                                resolve();
                            }
                        })
                    }));

                    filePromises.push(new Promise<void>(resolve => {
                        let newFilesProcessed: number = 0;
                        newFiles.forEach(newFile => {
                            dataTransfer.items.add(newFile);
                            newFilesProcessed++
                            if (newFilesProcessed === newFiles.length) {
                                resolve();
                            }
                        })
                    }));

                    Promise.all(filePromises).then(() => {
                        this.selectedFiles = dataTransfer.files;
                    })
                } else {
                    this.selectedFiles = event.dataTransfer.files;
                }
            } else {
                let dataTransfer = new DataTransfer();
                dataTransfer.items.add(event.dataTransfer.files[0]);
                this.selectedFiles = dataTransfer.files;
                if (this.photoOnly) {
                    this.generateImagePreview(event.dataTransfer.files[0]);
                }
            }
        }
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onDragEnter(event: DragEvent) {
        this.dragNestedCount++;
        console.log(this.dragNestedCount)
        event.preventDefault();
        this.isDragOver = true;
    }

    onDragLeave(event: DragEvent) {
        this.dragNestedCount--;
        console.log(this.dragNestedCount)
        if (this.dragNestedCount === 0) {
            event.preventDefault();
            this.isDragOver = false;
        }
    }

    onRemoveFile(indexToRemove: number) {
        let dataTransfer = new DataTransfer();
        let processedFiles = 0;
        while (processedFiles < this.selectedFiles.length) {
            if (indexToRemove !== processedFiles) {
                dataTransfer.items.add(this.selectedFiles[processedFiles]);
            }

            processedFiles++;
            if (processedFiles === this.selectedFiles.length) {
                this.selectedFiles = dataTransfer.files;
            }
        }
    }

    clearFiles() {
        this.selectedFiles = new DataTransfer().files;
        this.imagePreviewUrl = null;
    }

    onSubmitClick() {
        this.onSubmit.emit(this.selectedFiles);
    }

    private generateImagePreview(file: File) {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
            this.imagePreviewUrl = e.target?.result as string;
            this.onImageSelected.emit(this.imagePreviewUrl);
        };
        reader.readAsDataURL(file);
    }
}