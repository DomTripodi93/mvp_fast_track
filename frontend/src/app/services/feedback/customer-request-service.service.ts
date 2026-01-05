
import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Subject }  from "rxjs";
import { CustomerRequest } from "../../models/feedback/customer-request.model";


@Injectable({ providedIn: 'root' })
export class CustomerRequestService {
    customerRequestsHaveChanged: Subject<void> = new Subject<void>();
    customerRequestSelectionHaveChanged: Subject<void> = new Subject<void>();
    customerRequestOptionsHaveChanged: Subject<void> = new Subject<void>();

    customerRequestList: CustomerRequest[] = []; 
    
    emptyCustomerRequest: CustomerRequest = {
        customerRequestId: 0,
		newPage: false,
		onPage: "",
		featureDescription: "",
		customerRequestNotes: "",
		isActive: true,
        insertDate: new Date(),
        insertUser: "",
        updateDate: new Date(),
        updateUser: ""
    }

    
    
    customerRequestForUpsert: CustomerRequest = { ...this.emptyCustomerRequest };
    
    
    constructor(
        private http: HttpClient
    ) { }
    
    
    getCustomerRequest(
        searchTerm: string,
        activeOnly: boolean = false,
        
    ) {
        let apiRoute = "v1/CustomerRequest/GetCustomerRequest";
        let searchParams = {
            searchTerm,
            activeOnly,
            
        }
        
        return this.http.post<CustomerRequest[]>(
            apiRoute,
            searchParams
        ).pipe(map((results: CustomerRequest[]) => {
            return results;
        }));
    }
    
    getCustomerRequestSingle(
        primaryKeyValues: any
    ) {
        let apiRoute = "v1/CustomerRequest/GetCustomerRequestSingle";
        
        return this.http.post<CustomerRequest>(
            apiRoute,
            primaryKeyValues
        ).pipe(map((results: CustomerRequest) => {
            return results;
        }));
    }
    
    upsertCustomerRequest(
        customerRequest: CustomerRequest
    ) {
        let apiRoute = "v1/CustomerRequest/UpsertCustomerRequest";
        
        return this.http.post(
            apiRoute,
            customerRequest
        ).pipe(map((results: any) => {
            return results;
        }));
    }
    
    deleteCustomerRequest(
        customerRequest: CustomerRequest
    ) {
        let apiRoute = "v1/CustomerRequest/DeleteCustomerRequest";
        
        return this.http.post(
            apiRoute,
            customerRequest
        ).pipe(map((results: any) => {
            return results;
        }));
    }  
    
    bulkUploadCustomerRequest(
        customerRequests: CustomerRequest[]
    ) {
        let apiRoute = "v1/CustomerRequest/BulkUploadCustomerRequest";
        
        return this.http.post(
            apiRoute,
            customerRequests
        ).pipe(map((results: any) => {
            return results;
        }));
    }  
}
    
