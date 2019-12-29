import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { DiseaseCubeComponent } from "./disease-cube.component";

describe("DiseaseCubeComponent", () => {
  let component: DiseaseCubeComponent;
  let fixture: ComponentFixture<DiseaseCubeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DiseaseCubeComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiseaseCubeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
