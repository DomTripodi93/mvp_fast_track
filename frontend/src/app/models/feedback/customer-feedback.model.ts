
export interface CustomerFeedback {
    customerFeedbackId: number;
	rating: number;
	customerFeedbackNotes: string;
	additionalSuggestions: string;
	isActive: boolean;
	insertDate: Date;
	insertUser: string;
	updateDate: Date;
	updateUser: string;
}


