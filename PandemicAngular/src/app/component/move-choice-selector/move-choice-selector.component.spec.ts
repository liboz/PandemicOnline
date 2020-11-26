import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { MoveChoiceSelectorComponent } from "./move-choice-selector.component";

describe("MoveChoiceSelectorComponent", () => {
  let component: MoveChoiceSelectorComponent;
  let fixture: ComponentFixture<MoveChoiceSelectorComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [MoveChoiceSelectorComponent]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(MoveChoiceSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
