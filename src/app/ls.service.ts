import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";

export interface StorageEvent {
  key: string;
  oldValue: string;
  newValue: string;
  url: string;
  storageArea: string;
}

@Injectable({
  providedIn: "root"
})
export class LSService {
  $changes: Subject<StorageEvent>;
  constructor() {}

  on() {
    window.addEventListener(
      "storage",
      (event: any) => {
        this.$changes.next(event as StorageEvent);
      },
      false
    );
  }

  set(key: string, value: object) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  get(key: string): { [key: string]: any } {
    return JSON.parse(localStorage.getItem(key) || "{}");
  }

  remove(key: string) {
    localStorage.removeItem(key);
  }

  clear() {
    localStorage.clear();
  }
}
