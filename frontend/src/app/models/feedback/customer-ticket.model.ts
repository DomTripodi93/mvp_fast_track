
export interface CustomerTicket {
    customerTicketId: number;
	onPage: string;
	duringProcess: string;
	expectedOutput: string;
	actualOutcome: string;
	problemDescription: string;
	customerTicketNotes: string;
	isActive: boolean;
	insertDate: Date;
	insertUser: string;
	updateDate: Date;
	updateUser: string;
}


