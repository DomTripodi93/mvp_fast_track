import { Component, EventEmitter, Input, Output, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { LoadingSpinnerComponent } from "../loading-spinner/loading-spinner.component";
import { CustomButtonComponent } from '../custom-button/custom-button.component';
import { SettingsService } from '../../services/settings-service.service';
import { CanvasPosition } from '../../models/canvas-position.model';

@Component({
    selector: 'app-custom-cropper',
    imports: [
        LoadingSpinnerComponent,
        CustomButtonComponent
    ],
    templateUrl: './custom-cropper.component.html',
    styleUrl: './custom-cropper.component.css'
})
export class CustomCropperComponent implements OnInit, AfterViewInit {
    @Input() width: string = '400px';
    @Input() height: string = '400px';
    @Input() imgSrc: string = '';
    @Output() onCropped = new EventEmitter<string>();
    @Output() onCanceled = new EventEmitter<void>();
    @Input() startingTransform: CanvasPosition | null = null;

    @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('imageElement', { static: false }) imageRef!: ElementRef<HTMLImageElement>;

    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D;
    private image!: HTMLImageElement;

    // Image transformation properties
    scale: number = 1;
    translateX: number = 0;
    translateY: number = 0;

    // Dragging state
    isDragging: boolean = false;
    lastX: number = 0;
    lastY: number = 0;

    // Cropper dimensions
    cropperSize: number = 400;
    imageIsReady: boolean = false;

    constructor(
        private settingsServ: SettingsService
    ) { }

    ngOnInit(): void {
        const size = parseInt(this.width) || 400;
        this.cropperSize = size;
        this.setCropWidth();
    }

    setCropWidth() {
        if (this.settingsServ.isMobileView) {
            this.width = "300px";
            this.height = "300px";
            if (this.startingTransform) {
                this.startingTransform = {
                    translateX: this.startingTransform.translateX * .75,
                    translateY: this.startingTransform.translateY * .75,
                    scale: this.startingTransform.scale * .75
                }
            }
        }
    }

    ngAfterViewInit(): void {
        this.canvas = this.canvasRef.nativeElement;
        this.ctx = this.canvas.getContext('2d')!;

        // Set canvas size
        this.canvas.width = this.cropperSize;
        this.canvas.height = this.cropperSize;

        if (this.imgSrc) {
            this.loadImage();
        }
    }

    setStartingTransform() {
        this.translateX = this.startingTransform.translateX;
        this.translateY = this.startingTransform.translateY;
        this.scale = this.startingTransform.scale;
    }

    loadImage(): void {
        this.image = new Image();
        this.image.crossOrigin = 'anonymous';
        this.image.onload = () => {
            // Center and scale image to fit
            const imageAspect = this.image.width / this.image.height;
            const cropperAspect = 1; // Square

            if (imageAspect > cropperAspect) {
                // Image is wider
                this.scale = this.cropperSize / this.image.height;
            } else {
                // Image is taller or square
                this.scale = this.cropperSize / this.image.width;
            }

            if (this.startingTransform) {
                this.setStartingTransform();
            } else {
                // Center the image
                this.translateX = (this.cropperSize - this.image.width * this.scale) / 2;
                this.translateY = (this.cropperSize - this.image.height * this.scale) / 2;
            }
            this.draw();
        };
        this.image.src = this.imgSrc;
    }

    draw(): void {
        if (!this.ctx || !this.image) return;

        // Clear canvas
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw image
        this.ctx.save();
        this.ctx.translate(this.translateX, this.translateY);
        this.ctx.scale(this.scale, this.scale);

        this.ctx.drawImage(this.image, 0, 0);
        this.ctx.restore();

        // Draw overlay with circular cutout
        this.drawOverlay();
    }

    drawOverlay(): void {
        const centerX = this.cropperSize / 2;
        const centerY = this.cropperSize / 2;
        const radius = this.cropperSize / 2;

        this.ctx.save();

        // Create a path for the entire canvas
        this.ctx.beginPath();
        this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);

        // Create a circular hole (counter-clockwise for subtraction)
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);

        // Fill the area outside the circle with semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fill();

        this.ctx.restore();

        // Draw circle border
        this.ctx.save();
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
        this.imageIsReady = true;
    }


    onMouseDown(event: MouseEvent): void {
        this.isDragging = true;
        this.lastX = event.clientX;
        this.lastY = event.clientY;
    }

    onMouseMove(event: MouseEvent): void {
        if (!this.isDragging) return;

        const deltaX = event.clientX - this.lastX;
        const deltaY = event.clientY - this.lastY;

        this.translateX += deltaX;
        this.translateY += deltaY;

        this.lastX = event.clientX;
        this.lastY = event.clientY;

        this.draw();
    }

    onMouseUp(): void {
        this.isDragging = false;
    }

    onWheel(event: WheelEvent): void {
        event.preventDefault();

        const delta = event.deltaY > 0 ? 0.9 : 1.1;
        const newScale = this.scale * delta;

        // Limit zoom range
        if (newScale < 0.1 || newScale > 10) return;

        // Zoom towards mouse position
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        this.translateX = mouseX - (mouseX - this.translateX) * delta;
        this.translateY = mouseY - (mouseY - this.translateY) * delta;
        this.scale = newScale;

        this.draw();
    }

    getCroppedImage(): string {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d')!;

        tempCanvas.width = this.cropperSize;
        tempCanvas.height = this.cropperSize;

        // Draw only the image part
        tempCtx.save();
        tempCtx.translate(this.translateX, this.translateY);
        tempCtx.scale(this.scale, this.scale);
        tempCtx.drawImage(this.image, 0, 0);
        tempCtx.restore();

        // // Apply circular mask
        // const centerX = this.cropperSize / 2;
        // const centerY = this.cropperSize / 2;
        // const radius = this.cropperSize / 2;

        // tempCtx.globalCompositeOperation = 'destination-in';
        // tempCtx.beginPath();
        // tempCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        // tempCtx.fill();

        return tempCanvas.toDataURL('image/png');
    }

    emitCroppedImage(): void {
        const croppedDataUrl = this.getCroppedImage();
        this.onCropped.emit(croppedDataUrl);
    }

    cancelCrop(){
        this.onCanceled.emit();
    }
}
