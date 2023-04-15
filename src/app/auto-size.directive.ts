import { AfterViewChecked, Directive, ElementRef, OnDestroy, OnInit, Optional } from "@angular/core";
import { NgModel } from "@angular/forms";
import { Subscription } from "rxjs";

@Directive({ selector: "input[autoSize]" })
export class AutoSizeDirective implements OnInit, OnDestroy, AfterViewChecked
{
  private view?: HTMLElement;

  constructor(private element: ElementRef<HTMLInputElement>) 
  {
    this.updateView = this.updateView.bind(this);
    element.nativeElement.addEventListener("input", this.updateView);
  }

  ngOnInit(): void 
  {
    this.view = this.element.nativeElement.ownerDocument.createElement("div");
    this.view.style.visibility = "hidden";
    this.view.style.position = "absolute";
    this.view.style.whiteSpace = "nowrap";
    this.element.nativeElement.parentElement?.append(this.view);
  }

  ngOnDestroy(): void 
  {
    this.element.nativeElement.removeEventListener("input", this.updateView);
    this.view?.remove();
  }

  ngAfterViewChecked(): void 
  {
    this.updateView();
  }

  updateView()
  {
    const view = this.view;

    if (view)
    {
      const element = this.element.nativeElement; 
      const value = element.value;

      view.textContent = value;
      element.style.width = `${view.getBoundingClientRect().width}px`;
    }
  }
}
