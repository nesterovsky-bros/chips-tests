import { Component } from '@angular/core';
import { of } from 'rxjs';
import { FilterItem, FilterOption, ItemType } from './filter/filter.component';

const allOptions: FilterOption[] =
[
  {
    title: "דוח",
    type: ItemType.Integer,
    readonly: true
  },
  {
    title: "סניף",
    type: ItemType.Integer,
    pattern: /\d{3}/,
    values: (value: any) =>
    {
      let list = [172, 680];

      if (value != null)
      {
        value = String(value).toUpperCase();

        list = list.filter(item => String(item).toUpperCase().includes(value));
      }

      return of(list);
    } 
  },
  {
    title: "תאריך",
    type: ItemType.Date
  },
  {
    title: "חשבון",
    type: ItemType.String,
    pattern: /\d{4,}/,
  },
  {
    title: "סכום",
    type: ItemType.Decimal,
    pattern: /[+-]?[\d\s.,]+/,
  },
];

const [reportOption, branchOption, dateOption, accountOption] = allOptions;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'chips-tests';

  options = allOptions;

  items: FilterItem[] = 
  [
    { option: reportOption, value: 1203001 },
    { option: branchOption, value: 680 },
  ];

  autohide: boolean = true;
  searchCount: number = 0;
}
