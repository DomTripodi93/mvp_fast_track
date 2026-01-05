
import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Subject }  from "rxjs";
import { CustomerTicket } from "../../models/feedback/customer-ticket.model";


@Injectable({ providedIn: 'root' })
export class CustomerTicketService {
    customerTicketsHaveChanged: Subject<void> = new Subject<void>();
    customerTicketSelectionHaveChanged: Subject<void> = new Subject<void>();
    customerTicketOptionsHaveChanged: Subject<void> = new Subject<void>();

    customerTicketList: CustomerTicket[] = []; 
    
    emptyCustomerTicket: CustomerTicket = {
        customerTicketId: 0,
		onPage: "",
		duringProcess: "",
		expectedOutput: "",
		actualOutcome: "",
		problemDescription: "",
		customerTicketNotes: "",
		isActive: true,
        insertDate: new Date(),
        insertUser: "",
        updateDate: new Date(),
        updateUser: ""
    }

    
    
    customerTicketForUpsert: CustomerTicket = { ...this.emptyCustomerTicket };
    
    
    constructor(
        private http: HttpClient
    ) { }
    
    
    getCustomerTicket(
        searchTerm: string,
        activeOnly: boolean = false,
        
    ) {
        let apiRoute = "v1/CustomerTicket/GetCustomerTicket";
        let searchParams = {
            searchTerm,
            activeOnly,
            
        }
        
        return this.http.post<CustomerTicket[]>(
            apiRoute,
            searchParams
        ).pipe(map((results: CustomerTicket[]) => {
            return results;
        }));
    }
        
    getCustomerTicketSingle(
        primaryKeyValues: any
    ) {
        let apiRoute = "v1/CustomerTicket/GetCustomerTicketSingle";
        
        return this.http.post<CustomerTicket>(
            apiRoute,
            primaryKeyValues
        ).pipe(map((results: CustomerTicket) => {
            return results;
        }));
    }
    
    upsertCustomerTicket(
        customerTicket: CustomerTicket
    ) {
        let apiRoute = "v1/CustomerTicket/UpsertCustomerTicket";
        
        return this.http.post(
            apiRoute,
            customerTicket
        ).pipe(map((results: any) => {
            return results;
        }));
    }
    
    deleteCustomerTicket(
        customerTicket: CustomerTicket
    ) {
        let apiRoute = "v1/CustomerTicket/DeleteCustomerTicket";
        
        return this.http.post(
            apiRoute,
            customerTicket
        ).pipe(map((results: any) => {
            return results;
        }));
    }  
    
    bulkUploadCustomerTicket(
        customerTickets: CustomerTicket[]
    ) {
        let apiRoute = "v1/CustomerTicket/BulkUploadCustomerTicket";
        
        return this.http.post(
            apiRoute,
            customerTickets
        ).pipe(map((results: any) => {
            return results;
        }));
    }  
}
    
