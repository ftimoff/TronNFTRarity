import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';

interface TraitNode {
    key: string;
    value: string;
    checked: boolean;
    children?: TraitNode[];
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
    @ViewChild('viewDetailDiaglogRef') viewDetailDiaglogRef: TemplateRef<any>;

    // controls
    traitsTreeControl = new NestedTreeControl<TraitNode>((node) => node.children);
    traitCountTreeControl = new NestedTreeControl<TraitNode>((node) => node.children);
    traitsSource = new MatTreeNestedDataSource<TraitNode>();
    traitCountSource = new MatTreeNestedDataSource<TraitNode>();

    hasChild = (_: number, node: TraitNode) => !!node.children && node.children.length > 0;
    dialog: MatDialog;

    loading: {
        traits: boolean;
        nfts: boolean;
        traitCount: boolean;
    };

    // data
    collections: any;
    nfts: any = [];
    selectedCollection: any = '';
    selectedNft: any;
    searchText: string;

    // paging
    totalNfts: number;
    pageSize: number;
    pageIndex: number;
    pageSizeOptions: number[];
    filters: any[];
    sortBy: string;

    constructor(private http: HttpClient, _dialog: MatDialog) {
        this.dialog = _dialog;

        this.totalNfts = 0;
        this.pageIndex = 0;
        this.pageSize = 16;
        this.pageSizeOptions = [16, 40, 80, 160];
        this.filters = [];
        this.sortBy = 'rarity';

        this.loading = { nfts: false, traitCount: false, traits: false };
    }

    ngOnInit() {}

    ngAfterViewInit(): void {
        this.http.get(`${environment.apiUri}/collections`).subscribe((data: any) => {
            this.collections = data;

            this.selectedCollection = this.collections[0];
            this.loadNfts();
            this.loadTrails();
            this.loadTraitCount();
        });
    }

    onPageChanged(ev: any) {
        this.pageIndex = ev.pageIndex;
        this.pageSize = ev.pageSize;
        this.loadNfts();
    }

    onCollectionChanged() {
        this.filters = [];
        this.loadNfts();
        this.loadTrails();
        this.loadTraitCount();
    }

    onSortByChanged() {
        this.loadNfts();
    }

    onFiltersChanged(ev: any) {
        var filters: any = [];
        this.traitsSource.data.forEach(function (parent) {
            if (parent.children !== undefined) {
                parent.children.forEach(function (child) {
                    if (child.checked) {
                        filters.push({ trait_type: parent.key, value: child.key });
                    }
                });
            }
        });
        this.traitCountSource.data.forEach(function (parent) {
            if (parent.children !== undefined) {
                parent.children.forEach(function (child) {
                    if (child.checked) {
                        filters.push({ trait_type: parent.key, value: child.key });
                    }
                });
            }
        });

        this.filters = filters;
        this.loadNfts();
    }

    viewNftDetail(nft: any) {
        this.selectedNft = nft;
        this.dialog.open(this.viewDetailDiaglogRef);
    }

    loadNfts() {
        this.loading.nfts = true;
        this.nfts = [];
        this.http
            .post(`${environment.apiUri}/nfts`, {
                collection: this.selectedCollection.name,
                pageIndex: this.pageIndex,
                pageSize: this.pageSize,
                filters: this.filters,
                sortBy: this.sortBy
            })
            .subscribe((data: any) => {
                this.nfts = data.nfts;
                this.totalNfts = data.total;
                this.loading.nfts = false;
            });
    }

    loadTrails() {
        this.loading.traits = true;
        this.http.get(`${environment.apiUri}/traits?collection=${this.selectedCollection.name}`).subscribe((data: any) => {
            this.traitsSource.data = this.buildTreeData(data);
            this.loading.traits = false;
        });
    }

    loadTraitCount() {
        this.loading.traitCount = true;
        this.http.get(`${environment.apiUri}/traitCount?collection=${this.selectedCollection.name}`).subscribe((data: any) => {
            this.traitCountSource.data = [
                {
                    key: 'Trait Count',
                    checked: false,
                    value: '',
                    children: this.buildTreeData(data)
                }
            ];

            this.loading.traitCount = false;
        });
    }

    buildTreeData(data: any): any[] {
        let treeData: TraitNode[] = [];
        Object.keys(data).forEach(function (key, index) {
            var parent: TraitNode = {
                key: key,
                value: data[key],
                checked: false,
                children: []
            };

            Object.keys(data[key]).forEach(function (k, i) {
                if (k != 'sum' && parent.children !== undefined)
                    parent.children.push({
                        key: k,
                        value: data[key][k],
                        checked: false
                    });
            });

            treeData.push(parent);
        });

        return treeData;
    }

    search() {
        this.filters = [];
        if (this.searchText) this.filters.push({ ids: this.searchText.split(',').map(Number) });

        this.loadNfts();
    }
}
