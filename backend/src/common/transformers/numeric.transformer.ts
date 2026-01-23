
export class ColumnNumericTransformer {
    to(data: number | string | null): number | null {
        if (data === null || data === undefined) {
            return null;
        }
        return Number(data);
    }
    from(data: string | null): number | null {
        if (data === null || data === undefined) {
            return null;
        }
        const res = parseFloat(data);
        if (isNaN(res)) {
            return null;
        }
        return res;
    }
}
