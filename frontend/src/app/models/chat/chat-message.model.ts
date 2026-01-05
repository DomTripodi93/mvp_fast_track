
export interface ChatMessage {
    sentByUserId: number;
	sentToUserId: number;
	encryptedById: number;
	encryptedToId: number;
	messageBy: string;
	messageTo: string;
	insertDate: Date;
	updateDate: Date;
	isSeen: boolean;
	seenDate: Date;
	originalPostDate: Date;
	originalPostId: number;
}


