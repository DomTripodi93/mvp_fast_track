import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HelperService {
    showConfirm: boolean = false;
    confirmationMessage: string = "";
    denyText: string = "OK";
    confirmText: string = "Cancel";
    confirmationCallback: (confirmed: boolean) => void = () => {

    }

    constructor(
        private router: Router
    ) { }

    pipe = new DatePipe('en-US');

    primaryKeysHaveValues(currentValues: Record<string, any>, defaultValues: Record<string, any>) {
        return new Promise<boolean>(resolve => {
            let allValuesSet = true;
            let keys = Object.keys(currentValues);
            if (keys.length > 0) {
                let keysChecked = 0;
                keys.forEach(key => {
                    if (currentValues[key] === defaultValues[key]) {
                        allValuesSet = false;
                    }

                    keysChecked++;
                    if (keysChecked === keys.length) {
                        resolve(allValuesSet);
                    }
                })
            } else {
                resolve(true);
            }
        })
    }

    getBaseUrl() {
        let baseUrl = document.getElementsByTagName('base')[0].href;
        if (baseUrl.split(":")[1] === "//localhost") {
            return "http://localhost:5000/api/";
        } else {
            return "https://TetheeAPI.com/api/";
        }
    }

    setDateTimeForDisplay(date: Date | string) {
        if (typeof date === "string") {
            date = new Date(Date.parse(date));
        }

        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        })
    }

    setDateTimeString(date: Date) {
        return this.pipe.transform(date, "M/d/yyyy h:mm:ss a");
    }

    setDateTimeISOString(date: Date) {
        return this.pipe.transform(date, "yyyy-MM-ddTHH:mm:ss");
    }

    setDateTimeStringNoTimeZone(date: Date) {
        return this.pipe.transform(date, "yyyy-MM-ddTHH:mm:ss") + ".000Z";
    }

    setTimeStringFromDate(date: Date) {
        return this.pipe.transform(date, "hh:mm a");
    }

    getTimeString(date: Date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setDateString(date: Date) {
        return this.pipe.transform(date, "M/d/yyyy");
    }

    setDateString101(date: Date) {
        return this.pipe.transform(date, "MM/dd/yyyy");
    }

    setDateString101Time(date: Date) {
        return this.pipe.transform(date, "MM/dd/yyyy  h:mm a");
    }

    setURLDateString(date: Date) {
        return this.pipe.transform(date, "yyyy-MM-dd");
    }

    getDayOfWeek(date: Date) {
        return new Date(date).toLocaleString("en", { weekday: "long" })
    }

    checkString(object: any) {
        console.log(object);
        return JSON.stringify(object);
    }

    parseDate(dateString: string): Date | string {
        // console.log(dateString);
        if (dateString) {
            return new Date(Date.parse(dateString));
        } else {
            return dateString;
        }
    }

    getPhoneFormat(phone: string) {
        // let phoneNumberParts = phone.split("");
        // let phoneNumbers = phoneNumberParts.filter(character =>{
        //     return character !== "." && character !== "-" && character !== "/"
        // })
        if (phone.includes(".") || phone.includes("-") || phone.length === 0) {
            return phone;
        }
        return phone.substring(0, 3) + "-" + phone.substring(3, 6) + "-" + phone.substring(6)
    }

    reverseTimeString(time: string) {
        let timeHold = "2023-01-01T06:00:00";
        if (time.length > 0) {
            // console.log(time);
            let timeSplit = time.split(":");
            if (time.toLowerCase().includes("pm") && +timeSplit[0] !== 12) {
                timeSplit[0] = (+timeSplit[0] + 12) + "";
            }
            if (+timeSplit[0] < 10 && !timeSplit[0].includes("0")) {
                timeSplit[0] = "0" + timeSplit[0];
            }
            timeHold = "2023-01-01T" + timeSplit.join(":").substring(0, 5) + ":00"
            // else if (+timeSplit[0] < 12) {
            //     timeHold = +timeSplit[0] + ":" + timeSplit[1] + " AM"
            // } else if (+timeSplit[0] === 12) {
            //     timeHold = timeSplit[0] + ":" + timeSplit[1] + " PM"
            // }
        }
        return new Date(Date.parse(timeHold));
    }

    setTimeString(time: string) {
        let timeHold = time;
        let timeSplit = time.split(":");
        if (+timeSplit[0] > 12) {
            timeHold = (+timeSplit[0] - 12) + ":" + timeSplit[1] + " PM"
        } else if (+timeSplit[0] < 12) {
            timeHold = +timeSplit[0] + ":" + timeSplit[1] + " AM"
        } else if (+timeSplit[0] === 12) {
            timeHold = timeSplit[0] + ":" + timeSplit[1] + " PM"
        }
        return timeHold;
    }

    setDateForSlashDisplay(date: string) {
        let datePieces = date.split("-");
        return datePieces[1] + "/" + datePieces[2] + "/" + datePieces[0];
    }

    numberWithCommas(num: number) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    excelDateToJSDate(serial: number) {
        let utcDays = Math.floor(serial - 25569);
        let utcValue = utcDays * 86400;
        let date = new Date(utcValue * 1000);
        date.setUTCHours(0, 0, 0, 0);
        return date
    }

    onlyAlphaNumeric(string: string) {
        return string.replace(/\W/g, '');
    }

    compareDateStrings(date1: string, date2: string) {
        let dateParts1 = date1.split("-");
        let dateParts2 = date2.split("-");
        if (dateParts1[0] > dateParts2[0]) {
            return true;
        } else if (dateParts1[0] === dateParts2[0] && dateParts1[1] > dateParts2[1]) {
            return true;
        } else if (dateParts1[1] === dateParts2[1] && dateParts1[2] > dateParts2[2]) {
            return true;
        } else {
            return false;
        }
    }

    escapeForUrl(string: string) {
        return string.split("%").join("%25")
            .split("$").join("%24")
            .split('/').join("%2F")
            .split("+").join("%2B")
            .split(",").join("%2C")
            .split(":").join("%3A")
            .split(";").join("%3B")
            .split("&").join("%26")
            .split("=").join("%3D")
            .split("?").join("%3F")
            .split("@").join("%40")
            .split("#").join("%23")
            .split("\\").join("%5C");
    }

    unescapeFromUrl(string: string) {
        return string.split("%24").join("$")
            .split("%2F").join('/')
            .split("%2B").join("+")
            .split("%2C").join(",")
            .split("%3A").join(":")
            .split("%3B").join(";")
            .split("%26").join("&")
            .split("%3D").join("=")
            .split("%3F").join("?")
            .split("%40").join("@")
            .split("%5C").join("\\")
            .split("%23").join("#")
            .split("%25").join("%");
    }

    maskDateAsUtc(forDate: Date): Date {
        return new Date(
            Date.UTC(
                forDate.getFullYear(),
                forDate.getMonth(),
                forDate.getDate(),
                forDate.getHours(),
                forDate.getMinutes(),
                0,
                0
            )
        );
    }

    urlToBase64(url: string): Promise<string> {
        return new Promise<string>((resolve) => {
            fetch(url).then(response => {
                response.blob().then(blob => {
                    return this.convertBlobToBase64(blob).then((base64Image) => {
                        resolve(base64Image);
                    });
                })
            });
        })
    }

    convertBlobToBase64(blob: Blob): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader;
            reader.onerror = reject;
            reader.onload = () => {
                resolve(reader.result as string);
            };
            reader.readAsDataURL(blob);
        });
    }

    camelCaseToCapitalWords(str: string) {
        return str
            // Insert space before all caps
            .replace(/([A-Z])/g, ' $1')
            // Capitalize the first letter of each word
            .replace(/\b\w/g, char => char.toUpperCase())
            // Trim any leading space
            .trim();
    }

    roundNumber(value: number, decimals: number = 0): number {
        if (isNaN(value)) {
            return 0;
        } else {
            let factor = Math.pow(10, decimals);
            return Math.round(value * factor) / factor;
        }
    }

    timeFromSeconds(value: number): string {
        if (isNaN(value)) {
            return "0:00";
        } else {
            let hours = "0"
            if (value > 3600) {
                hours = Math.floor(value / 3600) + "";
            }
            let minutes = "00" + Math.floor((value % 3600) / 60);
            minutes = minutes.slice(-2)
            return hours + ":" + minutes;
        }
    }
}