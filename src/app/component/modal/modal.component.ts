import { Component, OnInit, Input } from "@angular/core";
import { ModalService } from "src/app/service/modal.service";

@Component({
  selector: "app-modal",
  templateUrl: "./modal.component.html",
  styleUrls: ["./modal.component.styl"]
})
export class ModalComponent implements OnInit {
  @Input() lost: boolean;
  constructor(private modalService: ModalService) {}

  ngOnInit() {}

  onClose() {
    this.modalService.destroyEvent();
  }
}
