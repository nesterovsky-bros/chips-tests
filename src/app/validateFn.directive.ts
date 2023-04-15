import { Directive, Input } from "@angular/core";
import { AbstractControl, AsyncValidatorFn, NG_ASYNC_VALIDATORS, ValidationErrors } from "@angular/forms";
import { Observable, of } from "rxjs";

@Directive(
{
  selector: "[validateFn]",
  providers: [{provide: NG_ASYNC_VALIDATORS, useExisting: ValidateFnDirective, multi: true}]
})
export class ValidateFnDirective
{
  @Input()
  validateFn?: AsyncValidatorFn;

  validate(control: AbstractControl): 
    Promise<ValidationErrors|null>|
    Observable<ValidationErrors|null>
  {
    return this.validateFn?.(control) ?? of(null);
  }
}
