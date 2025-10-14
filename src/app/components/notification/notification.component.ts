import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NotificationService } from "../../services/notification.service";

@Component({
    selector: "app-notification",
    standalone: true,
    imports: [CommonModule],
    templateUrl: "./notification.component.html",
    styleUrls: ["./notification.component.scss"],
})
export class NotificationComponent {
    notificationService = inject(NotificationService);

}