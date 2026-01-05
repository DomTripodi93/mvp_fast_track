import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth-service.service";
import { HelperService } from "../services/helper-service.service";
import { EMPTY } from "rxjs";

export const urlInterceptor: HttpInterceptorFn = (req, next) => {
    // let baseUrl = document.getElementsByTagName('base')[0].href;

    const authServ = inject(AuthService);
    const helperServ = inject(HelperService);
    // const windowLocation: string = window.location.href;

    let rootUrl = helperServ.getBaseUrl();
    // console.log(baseUrl)

    const apiRootRequest = req.clone({
        url: rootUrl + req.url
    })
    
    if (authServ.token !== "") {
        const authenticatedRequest = apiRootRequest.clone({
            headers: apiRootRequest.headers.append("Authorization", "Bearer " + authServ.token)
        })
        return next(authenticatedRequest);
    } else if (
        req.url.toLowerCase().includes(".pem") 
    ) {
        return next(req);
    } else if (
        req.url.toLowerCase().includes("ljwei03984345woldui485lwjeot40298dlsapiortjw49wi782hfuwe72dk") ||
        req.url.toLowerCase().includes("login") ||
        req.url.toLowerCase().includes("register") ||
        req.url.toLowerCase().includes("zipcodeinfo")
    ) {
        return next(apiRootRequest);
    } else {
        return EMPTY;
    }
}