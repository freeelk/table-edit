/**
 * Модель, содержащая данные и их структуру
 */

export default class Model {

    constructor(data) {

        this._structure = data[0];
        this._structure._id = 'id';
        this._rows = data.slice(1);
        this._rows = this._addIndex(data.slice(1));
    }

    get rows() {
        return this._rows;
    }

    set rows(rows) {
        this._rows = rows;
    }

    get structure() {
        return this._structure;
    }

    get data() {
        let result = this._removeIndex(this._rows.slice(0));

        let structure = Object.assign({}, this._structure);
        delete(structure._id);
        result.unshift(structure);

        return result;
    }

    setCellData(id, fieldName, value) {
        let rowNum = this._rows.findIndex(item => {
            return item[item.length - 1] == id;
        });

        let colNum = this.getColNum(fieldName);

        this._rows[rowNum][colNum] = value;
    }

    removeRowById(id) {
        let rowNum = this.getRowNumById(id);

        if (rowNum != -1) {
            this._rows.splice(rowNum, 1);
        }
    }

    addNewRow(beforeRowId) {
        let rowNum = this.getRowNumById(beforeRowId);

        if (rowNum !== -1) {
            let fieldsLength = Object.keys(this._structure).length;

            let newItem = Array.apply(null, Array(fieldsLength));
            newItem.fill('');
            let nextId = this._getNextId();
            newItem[fieldsLength - 1] = nextId;
            this._rows.splice(rowNum, 0, newItem);

            return nextId;
        }

        return null;
    }

    getId(row) {
        return row[row.length - 1];
    }

    getColNum(fieldName) {
        let index = 0;
        for (var column in this._structure) {
            if (column === fieldName) {
                return index;
            }
            index++;
        }

        return null;
    }

    getRowNumById(id) {
        return this._rows.findIndex(item => {
            return item[item.length - 1] == id;
        });
    }

    _getNextId() {
        let maxId = 0;
        this._rows.forEach(item => {
            if (item[item.length - 1] > maxId) {
                maxId = item[item.length - 1];
            }
        });

        return maxId + 1;
    }

    _addIndex(rows) {
        let id = 0;
        return rows.map(item => {
            item.push(id++);
            return item;
        });
    }

    _removeIndex(rows) {
        return rows.map(item => {
            item = [...item];
            item.splice(item.length - 1, 1);
            return item;
        });
    }

}
