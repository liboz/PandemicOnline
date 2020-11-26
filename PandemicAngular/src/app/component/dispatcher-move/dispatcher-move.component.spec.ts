import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { DispatcherMoveComponent } from "./dispatcher-move.component";

describe("DispatcherMoveComponent", () => {
  let component: DispatcherMoveComponent;
  let fixture: ComponentFixture<DispatcherMoveComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [DispatcherMoveComponent]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DispatcherMoveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});