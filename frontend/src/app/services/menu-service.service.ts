import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "./auth-service.service";

@Injectable({ providedIn: 'root' })
export class MenuService {
    menuVisible: boolean = false;
    headingVisible: boolean = true;
    contextClicked: boolean = false;
    subMenuOpened: number = -1;


    menuSections: any = [
        {
            id: 0,
            iconSrc: "/assets/calendar.png",
            itemText: "Events",
            itemValue: "",
            menuItems: [
                {
                    id: 0,
                    itemText: "Inspection",
                    itemValue: "inspection",
                    office: false,
                    setup: false,
                    admin: false
                },
                {
                    id: 1,
                    itemText: "Tool Change",
                    itemValue: "tool-change",
                    office: false,
                    setup: false,
                    admin: false
                },
                {
                    id: 2,
                    itemText: "Setup",
                    itemValue: "setup",
                    office: false,
                    setup: false,
                    admin: false
                }
            ],
            office: false,
            setup: false,
            admin: false
        },
        {
            id: 1,
            iconSrc: "/assets/desk.svg",
            itemText: "Office",
            itemValue: "",
            menuItems: [
                {
                    id: 0,
                    itemText: "Job Scheduling",
                    itemValue: "job-scheduling",
                    office: true,
                    setup: false,
                    admin: false
                },
                {
                    id: 1,
                    itemText: "Job Progress",
                    itemValue: "job-progress",
                    office: true,
                    setup: false,
                    admin: false
                }
            ],
            office: true,
            setup: false,
            admin: false
        },
        {
            id: 2,
            iconSrc: "/assets/document.svg",
            itemText: "Setup",
            itemValue: "",
            menuItems: [
                {
                    id: 0,
                    itemText: "Part Info",
                    itemValue: "part-info",
                    office: false,
                    setup: false,
                    admin: false
                },
                {
                    id: 1,
                    itemText: "Job Info",
                    itemValue: "job-info",
                    office: false,
                    setup: false,
                    admin: false
                },
                {
                    id: 2,
                    itemText: "Job Parts",
                    itemValue: "job-parts",
                    office: false,
                    setup: false,
                    admin: false
                },
                {
                    id: 3,
                    itemText: "Part Operation",
                    itemValue: "part-operation",
                    office: false,
                    setup: false,
                    admin: false
                },
                {
                    id: 4,
                    itemText: "Part Operation Inspection Step",
                    itemValue: "part-operation-inspection-step",
                    office: false,
                    setup: false,
                    admin: false
                },
                {
                    id: 5,
                    itemText: "Part Operation SOP",
                    itemValue: "part-operation-sop",
                    office: false,
                    setup: false,
                    admin: false
                },
                {
                    id: 6,
                    itemText: "Part Operation Common Difficulty",
                    itemValue: "part-operation-common-difficulty",
                    office: false,
                    setup: false,
                    admin: false
                },
                {
                    id: 8,
                    itemText: "Work Center Type",
                    itemValue: "work-center-type",
                    office: false,
                    setup: false,
                    admin: false
                },
                {
                    id: 9,
                    itemText: "Work Center",
                    itemValue: "work-center",
                    office: false,
                    setup: false,
                    admin: false
                },
                {
                    id: 10,
                    itemText: "Work Shift",
                    itemValue: "work-shift",
                    office: false,
                    setup: false,
                    admin: false
                },
                {
                    id: 14,
                    itemText: "Maintenence Task",
                    itemValue: "maintenence-task",
                    office: false,
                    setup: false,
                    admin: false
                },
                {
                    id: 15,
                    itemText: "Work Center Maintenence Task",
                    itemValue: "work-center-maintenence-task",
                    office: false,
                    setup: false,
                    admin: false
                },
                {
                    id: 17,
                    itemText: "Machine Tool Holder",
                    itemValue: "machine-tool-holder",
                    office: false,
                    setup: false,
                    admin: false
                },
                {
                    id: 18,
                    itemText: "Machine Tool",
                    itemValue: "machine-tool",
                    office: false,
                    setup: false,
                    admin: false
                },
                {
                    id: 19,
                    itemText: "Non Tooling Setup Step",
                    itemValue: "non-tooling-setup-step",
                    office: false,
                    setup: false,
                    admin: false
                },
                {
                    id: 20,
                    itemText: "Part Operation Setup",
                    itemValue: "part-operation-setup",
                    office: false,
                    setup: false,
                    admin: false
                },
            ],
            office: false,
            setup: true,
            admin: false
        },
        {
            id: 3,
            iconSrc: "/assets/feedback.svg",
            itemText: "Feedback",
            itemValue: "",
            menuItems: [
                {
                    id: 0,
                    itemText: "Tickets",
                    itemValue: "customer-ticket",
                    office: false,
                    setup: false,
                    admin: false
                },
                {
                    id: 1,
                    itemText: "Requests",
                    itemValue: "customer-request",
                    office: false,
                    setup: false,
                    admin: false
                },
                {
                    id: 2,
                    itemText: "Feedback",
                    itemValue: "customer-feedback",
                    office: false,
                    setup: false,
                    admin: false
                }
            ],
            office: false,
            setup: false,
            admin: false
        },
        {
            id: 4,
            icon: "folder",
            iconSrc: "/assets/lock.svg",
            itemText: "Admin",
            itemValue: "",
            menuItems: [
                {
                    id: 0,
                    itemText: "User",
                    itemValue: "your-projects/true",
                    office: false,
                    setup: false,
                    admin: true
                },
                {
                    id: 1,
                    itemText: "Project Pics",
                    itemValue: "project-list",
                    office: false,
                    setup: false,
                    admin: true
                }
            ],
            office: false,
            setup: false,
            admin: true
        },
        {
            id: 5,
            iconSrc: "/assets/logout.svg",
            itemText: "Logout",
            itemValue: "Logout",
            menuItems: [],
            office: true,
            setup: true,
            admin: true
        },
    ]


    constructor(
        private router: Router,
        private auth: AuthService
    ) { }


    navigateTo(routeTo: string) {
        if (routeTo.toLowerCase() === "logout") {
            if (confirm("Are you sure you want to log out?")) {
                this.toggleMenu(false);
                this.auth.logout();
            }
        } else {
            this.toggleMenu(false);
            this.router.navigate(["/" + routeTo]);
        }
    }


    openMenuOption(optionId: number) {
        this.contextClicked = true;
        this.subMenuOpened = this.subMenuOpened === optionId ? -1 : optionId;
        setTimeout(() => {
            this.contextClicked = false;
        }, 35)
    }

    toggleMenu(showMenu: boolean) {
        setTimeout(() => {
            this.menuVisible = showMenu
        }, 10);
    }

}


// {
//     id: 7,
//     itemText: "Part Operation Inspection Detail",
//     itemValue: "part-operation-inspection-detail",
//     office: false,
//     setup: false,
//     admin: false
// },
// {
//     id: 11,
//     itemText: "Scheduled Shift",
//     itemValue: "scheduled-shift",
//     office: false,
//     setup: false,
//     admin: false
// },
// {
//     id: 12,
//     itemText: "Scheduled Job",
//     itemValue: "scheduled-job",
//     office: false,
//     setup: false,
//     admin: false
// },
// {
//     id: 13,
//     itemText: "Non Conforming Part",
//     itemValue: "non-conforming-part",
//     office: false,
//     setup: false,
//     admin: false
// },
// {
//     id: 16,
//     itemText: "Maintenence Task Log",
//     itemValue: "maintenence-task-log",
//     office: false,
//     setup: false,
//     admin: false
// },
// {
//     id: 21,
//     itemText: "Part Operation Setup Log",
//     itemValue: "part-operation-setup-log",
//     office: false,
//     setup: false,
//     admin: false
// },
// {
//     id: 22,
//     itemText: "Part Operation Tool Change",
//     itemValue: "part-operation-tool-change",
//     office: false,
//     setup: false,
//     admin: false
// },