import { Component } from '@angular/core';
import { of } from 'rxjs';
import { FilterItem, FilterOption, ItemType } from './filter/filter.component';

const allOptions: FilterOption[] =
[
  {
    name: "report",
    title: "דוח",
    type: ItemType.Integer,
    readonly: true
  },
  {
    name: "branch",
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
    name: "correctnessDate",
    title: "תאריך",
    type: ItemType.Date
  },
  {
    name: "account",
    title: "חשבון",
    type: ItemType.String,
    pattern: /\d{4,}/,
  },
  {
    name: "amount",
    title: "סכום",
    type: ItemType.Decimal
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
