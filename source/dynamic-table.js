/**
 * Компонент динамической таблицы
 */

import DataService from "./data-service";

export default class DynamicTable {
    /**
     *  Получение данных, первичная прорисовка, настройка таблицы
     *
     * @param anchor Элемент в DOM, на место которого будет помещена таблица. Он содержит также параметры настройки таблицы
     */
    constructor(anchor) {
        this.defaultRowsPerPage = 10;
        this.changed = false;
        this.lastSavingError = '';

        this.dataService = new DataService(anchor.dataset.resource);
        this.dataService.getData()
            .then((model) => {

                this.model = model;

                this.filters = {};
                this.fields = [];
                for (var column in this.model.structure) {
                    this.fields.push(column);
                    this.filters[column] = '';
                }

                if (anchor.dataset.pagination === 'true') {
                    let rowsPerPage = this.defaultRowsPerPage;

                    if (anchor.dataset.rowsPerPage !== undefined) {
                        rowsPerPage = anchor.dataset.rowsPerPage;
                    }

                    this.pagination = new Pagination(rowsPerPage, this.model.rows.length);
                } else {
                    this.pagination = null;
                }

                this.render(anchor);

            })
            .catch((err) => {
                this.renderError(anchor, `Id: ${anchor.id} Header: ${anchor.dataset.header}  Error: ${err.statusText}`);
            });

    }

    /**
     * Первичная прорисовка таблицы в DOM
     *
     * @param anchor
     */
    render(anchor) {
        this.tableContainer = document.createElement('div');
        this.tableContainer.className = 'dynamicTableContainer';
        this.tableContainer.id = anchor.id;
        this.table = document.createElement('table');
        this.table.className = 'dynamicTable';

        if (anchor.dataset.header) {
            this._makeTableHeader(anchor.dataset.header);
        }

        this._makeInfoStr();
        this._makeButtons();
        this.tableContainer.appendChild(this.table);
        this._makeHeaders();
        this._makeFilters();
        this._makeRows();

        anchor.parentNode.replaceChild(this.tableContainer, anchor);

        this._setChangeListener(this.table, (event) => {

            if (event.target.className === 'filter-cell') {
                this._filter(event.target);
                return;
            }

            if (event instanceof MouseEvent && event.target.classList.contains('header-cell')) {
                this._sort(event.target);
                this.setFocusToActiveField();
                return;
            }

            if (event instanceof KeyboardEvent) {
                switch (event.key) {
                    case 'ArrowUp':
                        this.prevRow();
                        break;
                    case 'ArrowDown':
                        this.nextRow();
                        break;
                    case 'PageUp':
                        this.firstRow();
                        break;
                    case 'PageDown':
                        this.lastRow();
                        break;
                    case 'ArrowLeft':
                        if (event.shiftKey) {
                            this.prevCol();
                        }
                        break;
                    case 'ArrowRight':
                        if (event.shiftKey) {
                            this.nextCol();
                        }
                        break;
                    case 'Home':
                        this.firstCol();
                        break;
                    case 'End':
                        this.lastCol();
                        break;
                    default:
                        this.model.setCellData(this.activeRow, this.activeField, this.getDirtyActiveCellData());
                        this.changed = true;
                        this._updateInfoStr();
                        break;
                }
            }

            if (event instanceof MouseEvent) {
                let fieldName = event.target.dataset.fieldName;

                if (fieldName) {
                    let row = event.target.closest('[data-row-id]');
                    this.activeRow = row.dataset.rowId;
                    this.activeField = fieldName;
                    this.setFocusToActiveField();
                }
            }

        });
    }

    renderError(anchor, errorText) {
        let errorContainer = document.createElement('div');
        errorContainer.className = 'error-container';
        errorContainer.innerText = errorText;

        anchor.parentNode.replaceChild(errorContainer, anchor);
    }

    get activeRow() {
        return this._activeRow;
    }

    set activeRow(rowId) {
        this._activeRow = rowId;

        let rows = this.table.querySelectorAll('[data-row-id]');

        [...rows].forEach(function (row) {
            row.classList.remove('active-row');
            let columns = row.querySelectorAll('[data-field-name]');
            [...columns].forEach(function (column) {
                column.contentEditable = 'false';
                column.classList.remove('active-field');
            });
        });

        let activeRow = this.table.querySelector(`[data-row-id='${rowId}']`);
        if (activeRow) {
            activeRow.classList.add('active-row');
            this._activeRow = rowId;
            this.activeField = this._activeField;
        }

    }

    set activeField(fieldName) {

        if (!fieldName || fieldName === '_id') return;

        let row = this.table.querySelector(`[data-row-id='${this.activeRow}']`);

        let columns = row.querySelectorAll('[data-field-name]');
        [...columns].forEach(function (column) {
            column.contentEditable = 'false';
            column.classList.remove('active-field');
        });

        this._activeField = fieldName;
        let column = row.querySelector(`[data-field-name='${fieldName}']`);
        column.classList.add('active-field');
        column.contentEditable = 'true';
        //column.focus();
    }

    setFocusToActiveField() {
        let row = this.table.querySelector(`[data-row-id='${this.activeRow}']`);
        if (row) {
            let column = row.querySelector(`[data-field-name='${this.activeField}']`);
            if (column) {
                column.focus();
            }
        }
    }

    setDefaultActiveField() {
        let row = this.table.querySelector('[data-row-id]');
        if (row) {
            this.activeRow = row.dataset.rowId;
            this.activeField = this.fields[0];
        }
        this.setFocusToActiveField();
    }

    getDirtyActiveCellData() {
        let row = this.table.querySelector(`[data-row-id='${this.activeRow}']`);
        let column = row.querySelector(`[data-field-name='${this.activeField}']`);
        return column.innerText;
    }

    get activeField() {
        return this._activeField;
    }

    nextRow() {
        let row = this.table.querySelector(`[data-row-id='${this.activeRow}']`);
        if (row) {
            let nextRow = row.nextElementSibling;
            if (nextRow && nextRow.hasAttribute('data-row-id')) {
                this.activeRow = nextRow.dataset.rowId;
                this.setFocusToActiveField();
            }
        }
    }

    prevRow() {
        let row = this.table.querySelector(`[data-row-id='${this.activeRow}']`);
        if (row) {
            let prevRow = row.previousElementSibling;
            if (prevRow && prevRow.hasAttribute('data-row-id')) {
                this.activeRow = prevRow.dataset.rowId;
                this.setFocusToActiveField();
            }
        }
    }

    firstRow() {
        this.activeRow = 0;
        this.setFocusToActiveField();
    }

    lastRow() {
        this.activeRow = this.model.rows.length - 1;
        this.setFocusToActiveField();
    }

    nextCol() {
        let activeColNum = this._getColNum(this.activeField);
        if ((activeColNum === undefined) || activeColNum >= this.fields.length - 1) return;

        this.activeField = this.fields[activeColNum + 1];
        this.setFocusToActiveField();

    }

    prevCol() {
        let activeColNum = this._getColNum(this.activeField);
        if ((activeColNum === undefined) || activeColNum <= 0) return;

        this.activeField = this.fields[activeColNum - 1];
        this.setFocusToActiveField();

    }

    firstCol() {
        this.activeField = this.fields[0];
        this.setFocusToActiveField();
    }

    lastCol() {
        this.activeField = this.fields[this.fields.length - 2];
        this.setFocusToActiveField();
    }

    insert(rowId) {
        this.activeRow = this.model.addNewRow(rowId);
        this._refreshRows();
        this.setFocusToActiveField();
    }

    remove(rowId) {
        this.model.removeRowById(rowId);
        this._refreshRows();
    }

    sort(fieldName, rev = false) {
        let colNum = this._getColNum(fieldName);

        this.model.rows.sort((item, itemNext) => {
            if (item[colNum] === itemNext[colNum]) {
                return 0;
            }
            else {
                if (rev) {
                    return (item[colNum] < itemNext[colNum]) ? 1 : -1;
                } else {
                    return (item[colNum] < itemNext[colNum]) ? -1 : 1;
                }
            }
        });
        this._refreshRows();
    }

    setFilter(fieldName, term) {
        this.filters[fieldName] = term;
        this._refreshRows();
    }

    goFirstPage() {
        if (this.pagination) {
            this.pagination.rowsCount = this._getFilteredRows().length;
            this.pagination.goFirstPage();
            this._refreshRows();
        }
    }

    goPrevPage() {
        if (this.pagination) {
            this.pagination.rowsCount = this._getFilteredRows().length;
            this.pagination.goPrevPage();
            this._refreshRows();
        }
    }

    goNextPage() {
        if (this.pagination) {
            this.pagination.rowsCount = this._getFilteredRows().length;
            this.pagination.goNextPage();
            this._refreshRows();
        }
    }

    goLastPage() {
        if (this.pagination) {
            this.pagination.rowsCount = this._getFilteredRows().length;
            this.pagination.goLastPage();
            this._refreshRows();
        }
    }


    _filter(filterCell) {
        this.setFilter(filterCell.dataset.fieldName, event.target.innerText.trim());
    }

    /**
     * Сортировка строк таблицы (прямая или обратная)
     *
     * @todo Учет типов даных при сортировке
     * @param headerCell
     * @private
     */
    _sort(headerCell) {
        let headerCells = this.table.querySelectorAll('.header-cell');
        headerCells.forEach(item => {
            if (item !== headerCell) {
                item.classList.remove('sorted');
                item.classList.remove('sorted-rev');
            }
        });

        if (headerCell.classList.contains('sorted')) {

            headerCell.classList.remove('sorted');
            headerCell.classList.add('sorted-rev');
            this.sort(headerCell.dataset.fieldName, true);

        } else if (headerCell.classList.contains('sorted-rev')) {

            headerCell.classList.remove('sorted-rev');
            headerCell.classList.add('sorted');
            this.sort(headerCell.dataset.fieldName);

        } else {

            this.sort(headerCell.dataset.fieldName);
            headerCell.classList.add('sorted');

        }
    }

    /**
     * Перерисовка строк таблицы
     *
     * @private
     */
    _refreshRows() {
        do {
            var row = this.table.querySelector('[data-row-id]');
            if (row) row.parentNode.removeChild(row);
        } while (row);

        this._makeRows();
    }

    _getColNum(fieldName) {
        return this.fields.findIndex(element => element === fieldName);
    }

    /**
     * Прорисовка заголовка таблицы
     *
     * @param header
     * @private
     */
    _makeTableHeader(header) {
        this.tableHeader = document.createElement('h3');
        this.tableHeader.innerText = header;
        this.tableHeader.className = 'table-header';
        this.tableContainer.appendChild(this.tableHeader);
    }

    /**
     * Прорисовка информационной строки
     *
     * @private
     */
    _makeInfoStr() {
        this.infoStr = document.createElement('div');
        this.infoStr.className = 'info-str';
        this.tableContainer.appendChild(this.infoStr);
        this._updateInfoStr();
    }

    /**
     * Обновление информационной строки
     *
     * @private
     */
    _updateInfoStr() {
        let str = '';

        let filteredRowsCount = 0;
        let filteredRows = this._getFilteredRows();
        if (filteredRows) {
            filteredRowsCount = filteredRows.length;
        }

        if (this.lastSavingError !== '') {
            str += `<span class="alert-text">Savig error: ${this.lastSavingError}</span> `;
        }

        if (this.changed) {
            str += '<span class="alert-text">Changed</span> ';
        }

        if (this.pagination) {
            if (filteredRowsCount > 0)
                str += `Page ${this.pagination.currentPage} of ${this.pagination.pagesCount} `;
        }

        let totalRowsCount = this.model.rows.length;

        str += `Records: ${totalRowsCount} `;

        if (totalRowsCount != filteredRowsCount) {
            str += `Filtered: ${filteredRowsCount} `;
        }

        this.infoStr.innerHTML = str;
    }

    /**
     * Отрисовка строки заголовков таблицы
     *
     * @private
     */
    _makeHeaders() {
        let row = this.table.insertRow(-1);
        row.className = 'row-headers';

        for (var column in this.model.structure) {
            if (column !== '_id') {
                var headerCell = document.createElement('TH');
                headerCell.classList.add('header-cell');
                headerCell.dataset.fieldName = column;
                headerCell.innerHTML = this.model.structure[column];
                row.appendChild(headerCell);
            }
        }
    }

    /**
     * Отрисовка строки фильтров
     *
     * @private
     */
    _makeFilters() {
        let row = this.table.insertRow(-1);
        row.className = 'row-filters';

        for (var column in this.model.structure) {
            if (column !== '_id') {
                var filterCell = document.createElement('TD');
                filterCell.contentEditable = 'true';
                filterCell.classList.add('filter-cell');
                filterCell.dataset.fieldName = column;
                filterCell.innerHTML = '';
                row.appendChild(filterCell);
            }
        }
    }

    /**
     * Отрисовка строк таблицы
     *
     * @private
     */
    _makeRows() {
        let limit;
        let offset;

        let filteredRows = this._getFilteredRows();

        if (!filteredRows || filteredRows.length === 0) {
            if (this.pagination) {
                this.pagination.rowsCount = 0;
            }
            this._updateInfoStr();
            return;
        }

        if (this.pagination) {
            this.pagination.rowsCount = filteredRows.length;
            limit = this.pagination.limit;
            offset = this.pagination.offset;
        } else {
            limit = filteredRows.length;
            offset = 0;
        }

        let lastRowNum = Number(offset) + Number(limit);

        for (let rowNum = offset; rowNum < lastRowNum; rowNum++) {
            let row = this.table.insertRow(-1);
            row.dataset.rowId = this.model.getId(filteredRows[rowNum]);

            let colNum = 0;
            filteredRows[rowNum].forEach(columnData => {
                if (this.fields[colNum] !== '_id') {
                    let cell = row.insertCell(-1);
                    cell.dataset.fieldName = this.fields[colNum++];
                    cell.innerHTML = columnData;
                    cell.classList.add('table-cell');
                }
            });
        }

        if (!this.activeRow) {
            this.setDefaultActiveField();
        }

        this.activeRow = this.activeRow;
        this._updateInfoStr();
    }

    /**
     * Отрисовка строки кнопок
     *
     * @private
     */
    _makeButtons() {
        this.buttonsContainer = document.createElement('div');
        this.buttonsContainer.className = 'buttons-container';

        if (this.pagination) {
            var firstBtn = document.createElement('button');
            firstBtn.innerHTML = '<i class="fa fa-fast-backward" aria-hidden="true"></i>';

            var prevBtn = document.createElement('button');
            prevBtn.innerHTML = '<i class="fa fa-step-backward" aria-hidden="true"></i>';

            var nextBtn = document.createElement('button');
            nextBtn.innerHTML = '<i class="fa fa-step-forward" aria-hidden="true"></i>';

            var lastBtn = document.createElement('button');
            lastBtn.innerHTML = '<i class="fa fa-fast-forward" aria-hidden="true"></i>';

            this.buttonsContainer.appendChild(firstBtn);
            this.buttonsContainer.appendChild(prevBtn);
            this.buttonsContainer.appendChild(nextBtn);
            this.buttonsContainer.appendChild(lastBtn);

            firstBtn.addEventListener('click', () => {
                this.goFirstPage();
            });

            prevBtn.addEventListener('click', () => {
                this.goPrevPage();
            });

            nextBtn.addEventListener('click', () => {
                this.goNextPage();
            });

            lastBtn.addEventListener('click', () => {
                this.goLastPage();
            });

        }


        var insertBtn = document.createElement('button');
        insertBtn.innerHTML = '<i class="fa fa-plus-square" aria-hidden="true"></i>';
        this.buttonsContainer.appendChild(insertBtn);

        insertBtn.addEventListener('click', () => {
            if (this.activeRow !== undefined) {
                this.insert(this.activeRow);
            } else {
                this.insert(0);
            }
        });

        var removeBtn = document.createElement('button');
        removeBtn.innerHTML = '<i class="fa fa-minus-square" aria-hidden="true"></i>';
        this.buttonsContainer.appendChild(removeBtn);

        removeBtn.addEventListener('click', () => {
            if (this.activeRow !== undefined) {
                this.remove(this.activeRow);
            }

        });

        var saveBtn = document.createElement('button');
        saveBtn.innerHTML = '<i class="fa fa-floppy-o" aria-hidden="true"></i>';
        this.buttonsContainer.appendChild(saveBtn);

        saveBtn.addEventListener('click', () => {
            this.dataService.postData(this.model)
                .then(() => {
                    this.lastSavingError = '';
                })
                .catch(err => {
                    this.lastSavingError = err.statusText;
                });

            this.changed = false;
            this._updateInfoStr();
        });


        this.tableContainer.appendChild(this.buttonsContainer);
    }


    _getFilteredRows() {
        let filteredRows = [];

        this.model.rows.forEach(rowData => {
            if (this._isRowFiltered(rowData)) {
                filteredRows.push(rowData);
            }
        });

        return filteredRows;
    }

    _isRowFiltered(rowData) {
        let filtered = true;
        for (let colNum = 0; colNum < rowData.length; colNum++) {
            if (this.filters[this.fields[colNum]] !== '') {
                if (rowData[colNum].toString().indexOf(this.filters[this.fields[colNum]].toString()) === -1) {
                    filtered = false;
                }
            }
        }

        return filtered;
    }

    _setChangeListener(elem, listener) {

        elem.addEventListener('blur', listener);
        elem.addEventListener('keyup', listener);
        elem.addEventListener('paste', listener);
        elem.addEventListener('copy', listener);
        elem.addEventListener('cut', listener);
        elem.addEventListener('delete', listener);
        elem.addEventListener('mouseup', listener);

    }

}

/**
 * Класс логики пагинации
 *
 */
class Pagination {

    constructor(rowsPerPage, rowsCount, currentPage = 1) {
        this.rowsPerPage = rowsPerPage;
        this._rowsCount = rowsCount;
        this._currentPage = currentPage;
    }

    get rowsCount() {
        return this._rowsCount;
    }

    set rowsCount(rowsCount) {
        this._rowsCount = rowsCount;
        if (this._currentPage > Math.ceil(rowsCount / this.rowsPerPage)) {
            this._currentPage = Math.ceil(rowsCount / this.rowsPerPage);
        }

        else if (this._currentPage < 1) {
            this._currentPage = 1;
        }
    }

    get limit() {
        if (this.rowsPerPage > this.rowsCount) {
            return this.rowsCount;
        }

        if (this.currentPage === this.pagesCount) {
            if (this.rowsCount % this.rowsPerPage !== 0) {
                return this.rowsCount % this.rowsPerPage;
            } else {
                return this.rowsPerPage;
            }
        } else {
            return this.rowsPerPage;
        }
    }

    get offset() {
        return (this.currentPage - 1) * this.rowsPerPage;
    }

    get currentPage() {
        return this._currentPage;
    }

    set currentPage(currentPage) {
        if (currentPage > this.pagesCount) {
            this._currentPage = this.pagesCount;
        } else if (currentPage < 1) {
            this._currentPage = 1;
        } else {
            this._currentPage = currentPage;
        }
    }

    goFirstPage() {
        this.currentPage = 1;
    }

    goPrevPage() {
        this.currentPage--;
    }

    goNextPage() {
        this.currentPage++;
    }

    goLastPage() {
        this.currentPage = this.pagesCount;
    }

    get pagesCount() {
        return Math.ceil(this.rowsCount / this.rowsPerPage);
    }
}
