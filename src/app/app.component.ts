import { Component, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { SignatureComponent, SignatureData } from "./signature.component";
import { distinctUntilChanged, debounce } from "rxjs/operators";
import { LSService } from "./ls.service";
import { interval } from "rxjs";
import { MatSelectionList } from "@angular/material/list";

@Component({
  selector: "app-root",
  template: `
    <h1 class="center">ATTESTATION DE DÉPLACEMENT DÉROGATOIRE</h1>
    <p class="center">
      En application de l’article 1er du décret du 16 mars 2020 portant
      réglementation des déplacements dans le cadre de la lutte contre la
      propagation du virus Covid-19 :
    </p>
    <form novalidate [formGroup]="form">
      <section>
        <p>Je soussigné(e)</p>
        <main class="user-info">
          <mat-form-field appearance="outline">
            <mat-label>Mme / M.</mat-label>
            <input autocomplete="off" formControlName="name" matInput />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Né(e) le</mat-label>
            <input
              autocomplete="off"
              formControlName="birthday"
              matInput
              type="date"
            />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Demeurant</mat-label>
            <textarea rows="3" matInput formControlName="address"></textarea>
          </mat-form-field>
        </main>

        <main>
          <p matSubheader>
            certifie que mon déplacement est lié au motif suivant (cocher la
            case) autorisé par l’article 1er du décret du 16 mars 2020 portant
            réglementation des déplacements dans le cadre de la lutte contre la
            propagation du virus Covid-19 :
          </p>
          <mat-hint>Séléctionnez un motif parmi la liste ci-dessous:</mat-hint>
          <mat-selection-list multiple="false" formControlName="reason">
            <mat-list-option
              *ngFor="let reason of reasons"
              value="{{ reason.value }}"
            >
              {{ reason.description }};
            </mat-list-option>
          </mat-selection-list>
        </main>
      </section>

      <footer [formGroup]="form">
        <main class="signature-city-date">
          <mat-form-field appearance="outline">
            <mat-label>Fait à</mat-label>
            <input autocomplete="off" formControlName="city" matInput />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Le</mat-label>
            <input
              autocomplete="off"
              formControlName="date"
              matInput
              type="date"
            />
          </mat-form-field>
        </main>
        <main class="signature-pad">
          <img
            *ngIf="form.controls.signature.value"
            [src]="form.controls.signature.value"
            (click)="openSignatureDialog()"
          />
          <input autocomplete="off" formControlName="signature" type="hidden" />
        </main>

        <main class="action-buttons">
          <button
            mat-stroked-button
            (click)="openSignatureDialog()"
            color="accent"
          >
            Signer
          </button>
          <button
            mat-stroked-button
            (click)="print()"
            [disabled]="shouldDisableButton()"
          >
            Imprimer
          </button>
          <!-- <button
            color="primary"
            mat-stroked-button
            type="submit"
            [disabled]="shouldDisableButton()"
          >
            Télécharger le PDF
          </button> -->
        </main>
      </footer>
    </form>
  `,
  styles: [
    `
      h1 {
        font-weight: bold;
      }
      .center {
        text-align: center;
      }
      mat-form-field {
        width: 100%;
      }
      main {
        margin: 10px 0;
      }
      form {
        margin-top: 30px;
      }
      :host /deep/ .mat-list-option {
        height: auto !important;
        margin: 20px 0 20px;
      }

      :host /deep/ .mat-list-option {
        height: auto !important;
        margin: 20px 0 20px;
      }
      :host /deep/ .mat-list-single-selected-option {
        outline: dashed !important;
        background: white;
      }
      .signature-pad {
        display: flex;
        justify-content: flex-end;
        align-items: end;
        border-bottom: 1px solid lightgray;
        padding-bottom: 20px;
      }
      img {
        border: 1px solid gray;
        width: 100%;
        max-width: 355px;
      }
      footer {
        margin-top: 50px;
      }
      button {
        margin: 10px;
      }
      .action-buttons {
        display: flex;
        justify-content: center;
      }

      @media print {
        body {
          max-width: 700px;
        }
        .mat-list-base {
          padding: 0;
        }
        .mat-list-item-content {
          padding: 20px;
        }
        .user-info {
          margin-bottom: -30px;
        }
        form {
          margin-top: 15px;
        }
        p {
          margin: 0;
          padding: 5px;
        }
        main {
          margin: 20px;
        }
        .signature-pad {
          border: 0;
        }
        .action-buttons,
        .mat-list-option:not(.mat-list-single-selected-option),
        mat-hint {
          display: none;
        }
        footer {
          display: flex;
          margin: 0;
          justify-content: flex-end;
        }
        footer main {
        }
        .signature-city-date {
          display: flex;
          flex-direction: column;
        }
        img {
          width: 240px;
        }
      }
    `
  ]
})
export class AppComponent {
  reasons = [
    {
      description: `déplacements entre le domicile et le lieu d’exercice de l’activité
    professionnelle, lorsqu’ils sont indispensables à l’exercice
    d’activités ne pouvant être organisées sous forme de télétravail
    (sur justificatif permanent) ou déplacements professionnels ne
    pouvant être différés`,
      value: 0
    },
    {
      description: `déplacements pour effectuer des achats de première nécessité dans
      des établissements autorisés (liste sur gouvernement.fr)`,
      value: 1
    },
    {
      description: `certifie que mon déplacement est lié au motif suivant (cocher la
        case) autorisé par l’article 1er du décret du 16 mars 2020 portant
        réglementation des déplacements dans le cadre de la lutte contre la
        propagation du virus Covid-19`,
      value: 2
    },
    {
      description: `déplacements pour motif de santé`,
      value: 3
    },
    {
      description: `déplacements pour motif familial impérieux, pour l’assistance aux
      personnes vulnérables ou la garde d’enfants`,
      value: 3
    },
    {
      description: `déplacements brefs, à proximité du domicile, liés à l’activité
      physique individuelle des personnes, à l’exclusion de toute
      pratique sportive collective, et aux besoins des animaux de
      compagnie`,
      value: 4
    }
  ];
  form: FormGroup;
  @ViewChild(MatSelectionList, { static: true }) reasonsRef: MatSelectionList;

  constructor(
    public dialog: MatDialog,
    private formBuilder: FormBuilder,
    private storage: LSService
  ) {
    const date = new Date();
    const yearValue = date.getFullYear();
    const month = date.getMonth() + 1;
    const monthValue = (month < 10 ? `0` : ``) + month;
    const day = date.getDay();
    const dayValue = (day < 10 ? `0` : ``) + day;
    const dateValue = `${yearValue}-${monthValue}-${dayValue}`;

    this.form = this.formBuilder.group({
      name: ["", Validators.required],
      birthday: ["", Validators.required],
      address: ["", Validators.required],
      city: ["", Validators.required],
      date: [dateValue, Validators.required],
      reason: ["", Validators.required],
      signature: [null, Validators.required]
    });

    this.initializeForm();
  }

  ngOnInit() {
    this.form.valueChanges
      .pipe(
        distinctUntilChanged(),
        debounce(() => interval(500))
      )
      .subscribe(values => {
        this.storage.set("form", values);
      });
    this.loadSavedForm();
  }

  initializeForm() {
    const storedForm = this.storage.get("form");

    if (Object.keys(storedForm).length === 0) {
      console.log("init form with", this.form.value);
      this.storage.set("form", this.form.value);
    }
  }

  loadSavedForm() {
    const storedForm = this.storage.get("form");

    if (Object.keys(storedForm).length > 0) {
      console.log("restoring form", storedForm);
      this.form.patchValue(storedForm);

      if (storedForm.reasons) {
        this.reasonsRef.focus(storedForm.reasons.pop());
      }
    }
  }

  openSignatureDialog() {
    const dialogRef = this.dialog.open(SignatureComponent, {});
    dialogRef.afterClosed().subscribe((data: SignatureData) => {
      console.log(data);

      if (data) {
        this.form.patchValue({ signature: data.signatureImage });
      }
    });
  }

  print() {
    window.print();
  }

  shouldDisableButton() {
    return this.form.invalid;
  }
}
