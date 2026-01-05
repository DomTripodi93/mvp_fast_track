
export interface UserConnection {
    requestUserId: number;
	recipientUserId: number;
	isRequestorAnonymous: boolean;
	isRecipientAnonymous: boolean;
	isAccepted: boolean;
	isActive: boolean;
	isBlock: boolean;
	insertDate: Date;
	updateDate: Date;
}


