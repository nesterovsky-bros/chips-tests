import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {FormsModule} from "@angular/forms";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button'
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatMomentDateModule} from '@angular/material-moment-adapter';
import {MatChipsModule} from '@angular/material/chips';
import { FilterComponent } from './filter/filter.component';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { ValidateFnDirective } from './validate-fn.directive';
import { AutoSizeDirective } from './auto-size.directive';

@NgModule({
  declarations: [
    AppComponent,
    FilterComponent,
    ValidateFnDirective,
    AutoSizeDirective
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    NoopAnimationsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatChipsModule
  ],
  providers: 
  [
    {provide: MAT_DATE_LOCALE, useValue: 'he'}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
