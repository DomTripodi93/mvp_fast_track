
import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { UserInfoService } from '../../../services/settings/user-info-service.service';
import { ErrorService } from '../../../services/error-service.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth-service.service';
import { OptionService } from '../../../services/option-service.service';
import { CustomButtonComponent } from '../../../elements/custom-button/custom-button.component';
import { ErrorInfo } from '../../../models/error-info.model';
import { HelperService } from '../../../services/helper-service.service';
import { UserSettingsService } from '../../../services/settings/user-settings-service.service';
import { CustomPopupComponent } from '../../../elements/custom-popup/custom-popup.component';
import { CustomUploadComponent } from '../../../elements/custom-upload/custom-upload.component';
import { ImageUpload } from '../../../models/image-upload.model';
import { LoadingSpinnerComponent } from '../../../elements/loading-spinner/loading-spinner.component';
import { CustomCropperComponent } from '../../../elements/custom-cropper/custom-cropper.component';
import { CustomPictureViewerComponent } from '../../../elements/custom-picture-viewer/custom-picture-viewer.component';
import { CanvasPosition } from '../../../models/canvas-position.model';
import { SettingsService } from '../../../services/settings-service.service';

@Component({
    selector: 'app-user-picture',
    standalone: true,
    imports: [
        CustomButtonComponent,
        CustomPopupComponent,
        CustomUploadComponent,
        // ImageCropperModule
        LoadingSpinnerComponent,
        CustomCropperComponent,
        CustomPictureViewerComponent
    ],
    templateUrl: './user-picture-component.component.html',
    styleUrl: '../user-info-component.component.css'
})
export class UserPictureComponent implements OnInit, OnChanges {
    errorInfo: ErrorInfo = this.errorServ.resetErrorMessage();

    @Input() proPicUrl: string = '';
    @Output() onCloseComponent: EventEmitter<void> = new EventEmitter<void>();
    @Output() onProPicChanged: EventEmitter<void> = new EventEmitter<void>();
    @Input() isEditingProPic: boolean = false;
    isSelectingNewProPic: boolean = false;
    savingChanges: boolean = false;
    tempProPicUrl: string = "";
    tempProPicToCropUrl: string = "";
    isInitialLoad: boolean = true;
    showCloseButton: boolean = true;
    isClearingUpload: boolean = false;
    picUrl: string = this.helperServ.getBaseUrl() + "v1/Images/ServeImage/";
    latestTransform: CanvasPosition | null = null;


    constructor(
        private route: ActivatedRoute,
        private errorServ: ErrorService,
        public userInfoServ: UserInfoService,
        public auth: AuthService,
        public optionServ: OptionService,
        public userSettingsServ: UserSettingsService,
        public helperServ: HelperService,
        public settingsServ: SettingsService
    ) { }

    ngOnInit(): void {
        if (this.proPicUrl && this.proPicUrl.length > 0) {
            this.loadImageForCropper(this.proPicUrl);
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['proPicUrl'] && !this.isInitialLoad) {
            // console.log("hit1")
            this.tempProPicToCropUrl = "";
            this.isClearingUpload = true;
            setTimeout(() => {
                this.isClearingUpload = false;
                this.initializeNewSelection(true);
            }, 10);
        }
        this.isInitialLoad = false;
    }

    initializeNewSelection(forUpdate: boolean = false) {
        this.clearNewProPic();
        this.tempProPicUrl = "";
        this.tempProPicToCropUrl = this.proPicUrl;
        this.isEditingProPic = forUpdate;
        this.savingChanges = false;
    }

    onClickEditProPic() {
        this.isEditingProPic = true;
    }

    onStopEditingProPic() {
        this.isEditingProPic = false;
    }
    

    onConfirmCancelPhotoUpload() {
        this.helperServ.showConfirm = true;
        this.helperServ.confirmationMessage = "Are you sure you want to cancel uploading a new picture?";
        this.helperServ.confirmationCallback = (confirmed: boolean) => {
            this.helperServ.showConfirm = false;
            if (confirmed) {
                this.clearNewProPic();
            }
        }
    }

    onConfirmCancelPhotoCrop() {
        this.helperServ.showConfirm = true;
        this.helperServ.confirmationMessage = "Are you sure you want to cancel setting the cropped position of your picture?";
        this.helperServ.confirmationCallback = (confirmed: boolean) => {
            this.helperServ.showConfirm = false;
            if (confirmed) {
                this.onStopEditingProPic();
            }
        }
    }

    onCloseProPic() {
        this.onCloseComponent.emit();
    }

    setTempProPicUrl(url: string) {
        this.isSelectingNewProPic = true;
        this.tempProPicUrl = url;
    }

    setUpdateComplete() {
        this.savingChanges = true;
    }

    updateProPic(files: FileList) {
        // console.log(files)
        this.errorInfo = this.errorServ.resetErrorMessage();
        if (files.length > 0) {
            this.helperServ.convertBlobToBase64(files[0]).then((base64Image: string) => {
                let base64Parts = base64Image.split(",");
                base64Parts.shift();
                let profilePictureAsBase64 = base64Parts.join(",");
                this.uploadImage(profilePictureAsBase64);
            });
        }

        // let base64Parts = this.tempProPicBase64.split(",");
        // base64Parts.shift();
        // let profilePictureAsBase64 = base64Parts.join(",");
        // this.uploadImage(profilePictureAsBase64, false);
    }

    uploadCroppedProPic(croppedProPicBase64: string) {
        let base64Parts = croppedProPicBase64.split(",");
        base64Parts.shift();
        let profilePictureAsBase64 = base64Parts.join(",");
        this.uploadImage(profilePictureAsBase64, true);
    }

    uploadImage(proPic: string, cropped: boolean = false, capture: boolean = false) {
        this.savingChanges = true;
        // console.log(JSON.stringify(proPic))

        let imageForUpload: ImageUpload = {
            imageTitle: this.proPicUrl.split('/').pop() || "",
            fileAsString: proPic
        }

        this.userInfoServ.updateProPic(imageForUpload, cropped)
            .subscribe({
                next: (res: any) => {
                    // console.log(res);
                    this.isSelectingNewProPic = false;
                    this.onProPicChanged.emit();
                    this.initializeNewSelection(!cropped);

                },
                error: (err: any) => {
                    console.log(err);
                    let errorMessage = "An error occurred while uploading the Profile Picture. Please try again later.";
                    let errorInner = JSON.stringify(err.error.errors, null, "\t")

                    this.errorInfo = this.errorServ.getErrorMessage(errorMessage, errorInner);
                }
            })
    }

    loadImageForCropper(imageUrl: string) {
        // imageUrl = imageUrl.split("https://structural.blob.core.windows.net/appimages/")
        //     .join("https://structural.blob.core.windows.net/appimages/cropped_");
        this.tempProPicToCropUrl = imageUrl;
    }

    clearNewProPic() {
        this.isEditingProPic = false;
        this.isSelectingNewProPic = false;
        this.tempProPicUrl = "";
    }

    getLatestTransform(event: CanvasPosition) {
        this.latestTransform = event;
    }
}


