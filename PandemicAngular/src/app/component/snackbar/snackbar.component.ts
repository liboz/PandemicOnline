import { Component, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { SnackbarService } from "src/app/service/snackbar.service";
import { transition, trigger, style, animate } from "@angular/animations";

@Component({
  selector: "app-snackbar",
  templateUrl: "./snackbar.component.html",
  styleUrls: ["./snackbar.component.styl"],
  animations: [
    trigger("state", [
      transition(":enter", [
        style({
          bottom: "-100px",
          transform: "translate(-50%, 0%) scale(0.3)",
        }),
        animate(
          "150ms cubic-bezier(0, 0, 0.2, 1)",
          style({
            transform: "translate(-50%, 0%) scale(1)",
            opacity: 1,
            bottom: "20px",
          })
        ),
      ]),
      transition(":leave", [
        animate(
          "150ms cubic-bezier(0.4, 0.0, 1, 1)",
          style({
            transform: "translate(-50%, 0%) scale(0.3)",
            opacity: 0,
            bottom: "-100px",
          })
        ),
      ]),
    ]),
  ],
})
export class SnackbarComponent implements OnInit {
  show = () => this.items.length > 0;
  items: SnackBarItem[] = [];
  private snackbarSubscription: Subscription;
  constructor(private snackbarService: SnackbarService) {}

  ngOnInit() {
    this.snackbarSubscription = this.snackbarService.snackbarState.subscribe(
      (state) => {
        let snackbar = new SnackBarItem(state.message, state.type);
        this.items.push(snackbar);
        console.log(this.items);
        setTimeout(() => {
          this.items.shift();
        }, 3000);
      }
    );
  }

  ngOnDestroy() {
    this.snackbarSubscription.unsubscribe();
  }
}

class SnackBarItem {
  message: string = "This is snackbar";
  type: string = "success";

  constructor(message: string, type: string) {
    this.message = message;
    this.type = type;
  }
}
