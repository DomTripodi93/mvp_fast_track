
import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Subject }  from "rxjs";
import { ChatMessage } from "../../models/chat/chat-message.model";


@Injectable({ providedIn: 'root' })
export class ChatMessageService {
    chatMessagesHaveChanged: Subject<void> = new Subject<void>();
    chatMessageSelectionHaveChanged: Subject<void> = new Subject<void>();
    

    chatMessageList: ChatMessage[] = []; 
    
    emptyChatMessage: ChatMessage = {
        sentByUserId: 0,
		sentToUserId: 0,
		encryptedById: 0,
		encryptedToId: 0,
		messageBy: "",
		messageTo: "",
		isSeen: false,
		seenDate: new Date(),
		originalPostDate: new Date(),
		originalPostId: 0,
        insertDate: new Date(),
        updateDate: new Date(),
    }

    dropdownInfo: Record<string, any> = {
        "sentByUser": {
            optionListKey: "userInfo",
            displayKeys: ["sentByUserId"],
            fieldMap: {
                "sentByUserId": "sentByUserId" 
            }
        },
		"encryptedBy": {
            optionListKey: "pubKeys",
            displayKeys: ["encryptedById"],
            fieldMap: {
                "encryptedById": "encryptedById" 
            }
        }
    }

    
    chatMessageForUpsert: ChatMessage = { ...this.emptyChatMessage };
    
    
    constructor(
        private http: HttpClient
    ) { }
    
    
    getChatMessage(
        searchTerm: string,
        sentByUserId: number,
		encryptedById: number
    ) {
        let apiRoute = "v1/ChatMessage/GetChatMessage";
        let searchParams = {
            searchTerm,
            sentByUserId,
			encryptedById
        }
        
        return this.http.post<ChatMessage[]>(
            apiRoute,
            searchParams
        ).pipe(map((results: ChatMessage[]) => {
            return results;
        }));
    }
    
    getChatMessageSingle(
        primaryKeyValues: any
    ) {
        let apiRoute = "v1/ChatMessage/GetChatMessageSingle";
        
        return this.http.post<ChatMessage>(
            apiRoute,
            primaryKeyValues
        ).pipe(map((results: ChatMessage) => {
            return results;
        }));
    }
    
    upsertChatMessage(
        chatMessage: ChatMessage
    ) {
        let apiRoute = "v1/ChatMessage/UpsertChatMessage";
        
        return this.http.post(
            apiRoute,
            chatMessage
        ).pipe(map((results: any) => {
            return results;
        }));
    }
    
    deleteChatMessage(
        chatMessage: ChatMessage
    ) {
        let apiRoute = "v1/ChatMessage/DeleteChatMessage";
        
        return this.http.post(
            apiRoute,
            chatMessage
        ).pipe(map((results: any) => {
            return results;
        }));
    }  
   
} 
