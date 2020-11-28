import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ResearcherShareSelectorComponent } from "./researcher-share-selector.component";

describe("ResearcherShareSelectorComponent", () => {
  let component: ResearcherShareSelectorComponent;
  let fixture: ComponentFixture<ResearcherShareSelectorComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ResearcherShareSelectorComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ResearcherShareSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
