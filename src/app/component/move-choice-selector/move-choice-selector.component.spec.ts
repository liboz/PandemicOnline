import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MoveChoiceSelectorComponent } from './move-choice-selector.component';

describe('MoveChoiceSelectorComponent', () => {
  let component: MoveChoiceSelectorComponent;
  let fixture: ComponentFixture<MoveChoiceSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MoveChoiceSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MoveChoiceSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
