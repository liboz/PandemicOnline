import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { GameSocketComponent } from "./game-socket.component";

describe("GameSocketComponent", () => {
  let component: GameSocketComponent;
  let fixture: ComponentFixture<GameSocketComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [GameSocketComponent]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(GameSocketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
