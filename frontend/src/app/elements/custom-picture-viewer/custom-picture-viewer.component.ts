import { Component, EventEmitter, Input, Output, OnInit, AfterViewInit, ElementRef, ViewChild, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { LoadingSpinnerComponent } from "../loading-spinner/loading-spinner.component";
import { SettingsService } from '../../services/settings-service.service';
import { CanvasPosition } from '../../models/canvas-position.model';

@Component({
    selector: 'app-custom-picture-viewer',
    imports: [
        LoadingSpinnerComponent,
    ],
    templateUrl: './custom-picture-viewer.component.html',
    styleUrl: './custom-picture-viewer.component.css'
})
export class CustomPictureViewerComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    @Input() width: string = '500px';
    @Input() height: string = '500px';
    @Input() imgSrc: string = '';
    @Output() onCloseView = new EventEmitter<CanvasPosition>();
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

    // Viewer dimensions
    viewerSize: number = 400;
    imageIsReady: boolean = false;

    constructor(
        private settingsServ: SettingsService
    ) { }

    ngOnInit(): void {
        const size = parseInt(this.width) || 400;
        this.viewerSize = size;
        this.setCropWidth();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['imgSrc'] || changes['width'] || changes['height']) {
            this.initializeViewOptions();
        }
    }

    setStartingTransform() {
        if (this.startingTransform) {
            let positionalMultiplier = parseInt(this.width) / 400;
            this.translateX = this.startingTransform.translateX * positionalMultiplier;
            this.translateY = this.startingTransform.translateY * positionalMultiplier;
            this.scale = this.startingTransform.scale * positionalMultiplier;
        }
    }

    setCropWidth() {
        if (this.settingsServ.isMobileView) {
            this.width = "400px";
            this.height = "400px";
        }
    }

    ngAfterViewInit(): void {
        this.initializeViewOptions();
    }

    initializeViewOptions() {
        if (this.canvasRef){
            this.canvas = this.canvasRef.nativeElement;
            this.ctx = this.canvas.getContext('2d')!;
    
            // Set canvas size
            this.canvas.width = this.viewerSize;
            this.canvas.height = this.viewerSize;
    
            if (this.imgSrc) {
                this.loadImage();
            }
        }
    }

    loadImage(): void {
        this.image = new Image();
        this.image.crossOrigin = 'anonymous';
        this.image.onload = () => {
            // Center and scale image to fit
            const imageAspect = this.image.width / this.image.height;
            const viewerAspect = 1; // Square

            if (imageAspect > viewerAspect) {
                // Image is taller or square
                this.scale = this.viewerSize / this.image.width;
            } else {
                // Image is wider
                this.scale = this.viewerSize / this.image.height;
            }


            if (this.startingTransform) {
                this.setStartingTransform();
            } else {
                // Center the image
                this.translateX = (this.viewerSize - this.image.width * this.scale) / 2;
                this.translateY = (this.viewerSize - this.image.height * this.scale) / 2;
            }

            this.draw();
        };
        this.image.src = this.imgSrc;
    }

    draw(): void {
        if (!this.ctx || !this.image) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw image
        this.ctx.save();
        this.ctx.translate(this.translateX, this.translateY);
        this.ctx.scale(this.scale, this.scale);
        this.ctx.drawImage(this.image, 0, 0);
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

    ngOnDestroy(): void {
        let positionalMultiplier = 400 / parseInt(this.width)
        const outputPostion: CanvasPosition = {
            translateX: this.translateX * positionalMultiplier,
            translateY: this.translateY * positionalMultiplier,
            scale: this.scale * positionalMultiplier
        }
        this.onCloseView.emit(outputPostion);
    }
}
