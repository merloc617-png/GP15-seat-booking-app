'use strict';

function createSectors() {
    return [
        new Sector('A1', 1.0, 20, 20),
        new Sector('A2', 1.2, 20, 20, 20),
        new Sector('B1', 1.2, 20, 20, 20, 20),
        new Sector('B1L', 1.4, 1, 1, 1, 1, 1, 1),
        new Sector('B2L', 1.4, 1, 1, 1, 1, 1, 1),
        new Sector('C1L', 1.5, 12)
    ];
}

const localStorageSpace = function () {
    let data = '';

    console.log('Current local storage: ');
    for (let key in window.localStorage) {
        if (window.localStorage.hasOwnProperty(key)) {
            data += window.localStorage[key];
            console.log(key + ' = ' + ((window.localStorage[key].length * 16) / (8 * 1024)).toFixed(2) + ' KB');
        }
    }

    console.log(data ? '\n' + 'Total space used: ' + ((data.length * 16) / (8 * 1024)).toFixed(2) + ' KB' : 'Empty (0 KB)');
    console.log(data ? 'Approx. space remaining: ' + (5120 - ((data.length * 16) / (8 * 1024)).toFixed(2)) + ' KB' : '5 MB');
};
