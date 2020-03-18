import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from "@angular/core";
export interface SignatureData {
  signatureData: string[];
  signatureImage: string;
}

@Component({
  selector: "app-signature",
  template: `
    <section class="portrait-info">
      Merci de retourner votre téléphone pour signer.
    </section>
    <section class="signature-block">
      <h2>Signature</h2>
      <canvas width="300" height="200" #signatureCanvas></canvas>
    </section>
  `,
  styles: [
    `
      canvas {
        border: 1px solid #4355a9;
      }
      button {
        margin: 10px;
      }
      .action-buttons {
        display: flex;
        justify-content: center;
      }
      .portrait-info {
        display: none;
      }
    `
  ]
})
export class SignatureComponent implements OnInit {
  @ViewChild("signatureCanvas", { static: true })
  signatureCanvasRef: ElementRef<HTMLCanvasElement>;

  signaturePad: any;
  @Input() signatureData: any;

  @Output() onSignatureData: EventEmitter<SignatureData>;
  @Output() onSignatureClear: EventEmitter<SignatureData>;

  constructor() {
    this.onSignatureData = new EventEmitter();
    this.onSignatureClear = new EventEmitter();
  }

  ngOnInit(): void {
    this.signaturePad = new window["SignaturePad"](
      this.signatureCanvasRef.nativeElement,
      {
        // minWidth: 1,
        // maxWidth: 5,
        // penColor: "rgb(66, 133, 244)",
        onEnd: () => this.save()
      }
    );
  }

  ngOnChanges(val: SimpleChanges) {
    // defer task
    setTimeout(_ => {
      const data = val.signatureData?.currentValue;
      if (data && this.signaturePad) {
        this.signaturePad.fromData(data);
      }
    });
  }

  save() {
    let png = this.signaturePad.toDataURL();
    let data = this.signaturePad.toData();
    this.onSignatureData.emit({
      signatureData: data,
      signatureImage: png
    } as SignatureData);
  }

  clear() {
    this.signaturePad.clear();
    this.onSignatureClear.emit(this.signaturePad.isEmpty());
  }
}
