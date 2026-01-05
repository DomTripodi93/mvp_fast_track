
import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Subject }  from "rxjs";
import { CustomerFeedback } from "../../models/feedback/customer-feedback.model";


@Injectable({ providedIn: 'root' })
export class CustomerFeedbackService {
    customerFeedbacksHaveChanged: Subject<void> = new Subject<void>();
    customerFeedbackSelectionHaveChanged: Subject<void> = new Subject<void>();
    customerFeedbackOptionsHaveChanged: Subject<void> = new Subject<void>();

    customerFeedbackList: CustomerFeedback[] = []; 
    
    emptyCustomerFeedback: CustomerFeedback = {
        customerFeedbackId: 0,
		rating: 0,
		customerFeedbackNotes: "",
		additionalSuggestions: "",
		isActive: true,
        insertDate: new Date(),
        insertUser: "",
        updateDate: new Date(),
        updateUser: ""
    }

    
    
    customerFeedbackForUpsert: CustomerFeedback = { ...this.emptyCustomerFeedback };
    
    
    constructor(
        private http: HttpClient
    ) { }
    
    
    getCustomerFeedback(
        searchTerm: string,
        activeOnly: boolean = false,
        
    ) {
        let apiRoute = "v1/CustomerFeedback/GetCustomerFeedback";
        let searchParams = {
            searchTerm,
            activeOnly,
            
        }
        
        return this.http.post<CustomerFeedback[]>(
            apiRoute,
            searchParams
        ).pipe(map((results: CustomerFeedback[]) => {
            return results;
        }));
    }
        
    getCustomerFeedbackSingle(
        primaryKeyValues: any
    ) {
        let apiRoute = "v1/CustomerFeedback/GetCustomerFeedbackSingle";
        
        return this.http.post<CustomerFeedback>(
            apiRoute,
            primaryKeyValues
        ).pipe(map((results: CustomerFeedback) => {
            return results;
        }));
    }
    
    upsertCustomerFeedback(
        customerFeedback: CustomerFeedback
    ) {
        let apiRoute = "v1/CustomerFeedback/UpsertCustomerFeedback";
        
        return this.http.post(
            apiRoute,
            customerFeedback
        ).pipe(map((results: any) => {
            return results;
        }));
    }
    
    deleteCustomerFeedback(
        customerFeedback: CustomerFeedback
    ) {
        let apiRoute = "v1/CustomerFeedback/DeleteCustomerFeedback";
        
        return this.http.post(
            apiRoute,
            customerFeedback
        ).pipe(map((results: any) => {
            return results;
        }));
    }  
    
    bulkUploadCustomerFeedback(
        customerFeedbacks: CustomerFeedback[]
    ) {
        let apiRoute = "v1/CustomerFeedback/BulkUploadCustomerFeedback";
        
        return this.http.post(
            apiRoute,
            customerFeedbacks
        ).pipe(map((results: any) => {
            return results;
        }));
    }  
}
    
