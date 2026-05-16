'use strict';

class SeatBookingApp {
    constructor(name) {
        this._name = name;
        this._sectors = [];
        this._priceMultipliers = [];
        this._services = [];
        this._currentServiceId = '';
    }
    getName() {
        return this._name;
    }
    addSector(sector) {
        this._sectors.push(sector);
    }
    getSectorsArray() {
        return this._sectors;
    }
    setPriceMultipliersArray() {
        // get sectors array
        const sectors = this.getSectorsArray();
        sectors.forEach((sector) => {
            const sectorId = sector.getId();
            const sectorPrice = sector.getPriceMultiplier();
            this._priceMultipliers.push(
                {
                    sector: sectorId,
                    priceMultiplier: sectorPrice
                }
            );
        });
    }
    getPriceMultipliersArray() {
        return this._priceMultipliers;
    }
    renderSectorsList() {
        // get price multipliers array
        const sectors = this.getPriceMultipliersArray()
        // get container for sectors list (<ul>)
        const container = document.querySelector(`#sectors-list`);
        // clear container
        container.innerHTML = "";
        // populate container with existing sectors
        sectors.forEach((sector) => {
            const listElement = document.createElement('li');
            const sectorId = sector.sector;
            const label = document.createElement('label');
            label.setAttribute('for', `price-${sectorId}`);
            label.textContent = `Multiplier for ${sectorId}`;
            const price = document.createElement('input');
            price.type = 'number';
            price.min = '0';
            price.step = '0.1';
            price.setAttribute('id', `price-${sectorId}`);
            price.setAttribute('name', `price-${sectorId}`);
            price.value = sector.priceMultiplier;
            listElement.appendChild(label);
            listElement.appendChild(price);
            container.appendChild(listElement);
        })
    }
    addService(service) {
        this._services.push(service);
    }
    getServicesArray() {
        return this._services;
    }
    renderServicesList() {
        // get services array
        const services = this.getServicesArray();
        // get container (dropdown element from Document)
        const dropdownElement = document.querySelector(`#services-list`);
        // clear container
        dropdownElement.innerHTML = "";
        // populate container with existing services
        services.forEach((service) => {
            const optionElement = document.createElement('option');
            optionElement.setAttribute('value', service.getId());
            optionElement.textContent = service.getName();
            dropdownElement.appendChild(optionElement);
        })
        // set initial active service
        this.setCurrentServiceId(dropdownElement.value)
    }
    getCurrentServiceId() {
        return this._currentServiceId;
    }
    getCurrentService() {
        // this.renderServicesList();
        // get services array
        const services = this.getServicesArray();
        return services.find((service) => {
            return service.getId() === this.getCurrentServiceId()
        })
    }
    setCurrentServiceId(serviceId) {
        this._currentServiceId = serviceId;
        // console.log(this.getCurrentService());
    }
    renderCurrentServiceData() {
        // get current service
        const currentService = this.getCurrentService();

        if(currentService) {
            // get input elements
            const inputServiceName = document.querySelector(`#service-name`);
            const inputServicePrice = document.querySelector(`#service-price`);
            // set current service data as input values
            inputServiceName.value = currentService.getName();
            inputServicePrice.value = currentService.getPrice();
        }
    }
    cacheServices() {
        // check if localStorage is available
        if(typeof(Storage) !== "undefined") {
            // localStorage is available
            localStorage.setItem(`sba-services-${this.getName()}`, JSON.stringify(this.getServicesArray()));
        } else {
            // localStorage is not available
            window.alert(`Access to localStorage in this browser is not available. Data cannot be saved.`);
            throw Error(`Access to localStorage in this browser is not available. Data cannot be saved.`);
        }
    }
    fetchServices() {
        // fetch data from localStorage
        const servicesJSON = JSON.parse(localStorage.getItem(`sba-services-${this.getName()}`));

        if(!servicesJSON) {
            // if there's no data, notify user
            console.log(`Let's add some services. Use the form on the left.`)
        } else {
            servicesJSON.forEach((service) => {
                // create Service instances and add to app's array
                const serviceInstance = (new Service(service._name, service._price))
                serviceInstance.setBookedSeatsArray(service._seatsBooked);
                this.addService(serviceInstance)
            })
        }
    }
    updateOrderDetails() {
        const currentService = this.getCurrentService();
        const container = document.querySelector(`#order-details`);
        const totalPriceContainer = document.querySelector(`#order-total-price`);
        const emptyMessage = document.querySelector(`#order-empty-msg`);

        container.innerHTML = '';
        totalPriceContainer.textContent = '';

        if (!currentService) {
            if (emptyMessage) emptyMessage.hidden = false;
            return;
        }

        const servicePrice = currentService.getPrice();
        const priceMultipliers = this.getPriceMultipliersArray();
        const reservedSeats = currentService.getReservedSeats();
        let totalPrice = 0;

        reservedSeats.forEach((seat) => {
            const currentSecotrId = seat.parentElement.parentElement.id;
            const sectorPrice = priceMultipliers.find((element) => {
                return element.sector === currentSecotrId;
            }).priceMultiplier;
            const seatPrice = parseFloat((servicePrice * sectorPrice).toFixed(2));
            totalPrice += seatPrice;

            const listItem = document.createElement(`li`);
            const listItemId = document.createElement(`span`);
            listItemId.textContent = seat.id;
            const listItemPrice = document.createElement(`span`);
            listItemPrice.textContent = `$${seatPrice}`;
            listItem.appendChild(listItemId);
            listItem.appendChild(listItemPrice);
            container.appendChild(listItem);
        });

        if (emptyMessage) {
            emptyMessage.hidden = reservedSeats.length > 0;
        }

        if (reservedSeats.length > 0) {
            const formattedTotal = parseFloat(totalPrice.toFixed(2));
            totalPriceContainer.textContent = `Total price: $${formattedTotal}`;
        }
    }
    /* disabled until there is a way of creating sectors by user
    cacheSectors() {
        // check if localStorage is available
        if(typeof(Storage) !== "undefined") {
            // localStorage is available
            localStorage.setItem(`sba-sectors-${this.getName()}`, JSON.stringify(this.getSectorsArray()));
        } else {
            // localStorage is not available
            window.alert(`Access to localStorage in this browser is not available. Data cannot be saved.`);
            throw Error(`Access to localStorage in this browser is not available. Data cannot be saved.`);
        }
    }
    fetchSectors() {
        // fetch data from localStorage
        const sectorsJSON = JSON.parse(localStorage.getItem(`sba-sectors-${this.getName()}`));

        if(!sectorsJSON) {
            // if there's no data, notify user
            console.log(`There are no sectors in localStorage`)
        } else {
            sectorsJSON.forEach((sector) => {
                // create Service instances and add to app's array
                const sectorInstance = (new Sector(sector._id, sector._priceMultiplier))
                // serviceInstance.setBookedSeatsArray(sector._seatsBooked);
                this.addSector(sectorInstance)
            })
        }
    }
    */
};

class Service {
    constructor(name, price) {
        this._id = crypto.randomUUID();
        this._name = name;
        this._price = price;
        this._seatsReserved = []; // contains seats' IDs
        this._seatsBooked = []; // contains seats' IDs
    }
    getId() {
        return this._id;
    }
    getName() {
        return this._name;
    }
    getPrice() {
        return this._price;
    }
    setName(name) {
        this._name = name;
    }
    setPrice(price) {
        this._price = price;
    }
    getBookedSeats() {
        return this._seatsBooked;
    }
    bookSeats() {
        // get reserved seats
        const reservedSeats = this.getReservedSeats();
        // transfer elements to array for booked seats
        reservedSeats.forEach((seat) => {
            this._seatsBooked.push(seat.id)
        })
        // clear `reserved seats` array
        this.clearReservedSeats();
        // update corresponding `seat` elements on the page
        this.markBookedSeats();
    }
    getReservedSeats() {
        return this._seatsReserved;
    }
    addReservedSeat(seat) {
        this._seatsReserved.push(seat)
    }
    removeReservedSeat(seatId) {
        const index = this._seatsReserved.findIndex((seat) => {
            return seat.id === seatId;
        });
        if (index !== -1) {
            this._seatsReserved.splice(index, 1);
        }
    }
    clearReservedSeats() {
        this._seatsReserved = [];
    }
    setBookedSeatsArray(array) {
        this._seatsBooked = array;
    }
    markBookedSeats() {
        // get all rendered seat elements
        const seatElements = document.querySelectorAll('.seat');
        // refresh seats' classes
        seatElements.forEach((seat) => {
            if(this._seatsBooked.includes(seat.id)) {
                seat.classList.remove('seat--reserved');
                seat.classList.add('seat--booked');
                syncSeatAccessibility(seat);
            }
        })
    }
};

class Sector {
    constructor(id, priceMultiplier = 1, ...seatsInRow) {
        this._id = `s-${String(id)}`;
        this._priceMultiplier = priceMultiplier;
        this._rows = seatsInRow.length;
        this._seats = [...seatsInRow];
        
        // create array of rows and seats
        // rows
        for(let i = 1; i <= seatsInRow.length; i++) {
            const rowId = `${this._id}-${i}`;
            
            // seats
            for(let j = 1; j <= seatsInRow[i-1]; j++) {
                const seatId = `${rowId}-${j}`;
                // create new seat object and push it into array
                this._seats.push({
                    sector: this._id,
                    row: rowId,
                    seat: seatId
                });
            }
        }
    }
    getId() {
        return this._id;
    }
    getPriceMultiplier() {
        return this._priceMultiplier;
    }
    setPriceMultiplier(priceMultiplier) {
        this._priceMultiplier = priceMultiplier;
    }
    renderSector() {
        // get main app container
        const appContainer = document.querySelector(`#seat-booking-app`);
        // if there is no container, throw error
        if(!appContainer) throw Error(`App container not found`);
        
        // get seats container
        const seatsContainer = document.querySelector(`#seats`);
        // if there is no container, throw error
        if(!seatsContainer) throw Error(`Seats container not found`);
        // get sector's id
        const sectorId = this._id;
        // get sector's name (without the `s-` prefix)
        const sectorName = sectorId.slice(2);
        // get `seats` array
        const seats = this._seats;

        // create sector container
        const sectorElement = document.createElement('div');
        sectorElement.classList.add(`sector`);
        sectorElement.setAttribute(`id`, sectorId);
        sectorElement.style.gridArea = sectorName;
        // append sector to the seats container
        seatsContainer.appendChild(sectorElement);

        for(let i = 0; i < this._rows; i++) {
            // create row container
            const rowElement = document.createElement('div');
            rowElement.classList.add(`row`);
            rowElement.setAttribute(`id`, `${sectorId}-${i + 1}`);
            // append row to sector container
            sectorElement.appendChild(rowElement);

            for(let j = 0; j < seats.length; j++) {
                // check if seat belongs to current row
                if (seats[j].row === `${sectorId}-${i + 1}`) {
                    const seatElement = document.createElement('button');
                    seatElement.type = 'button';
                    seatElement.classList.add(`seat`);
                    seatElement.setAttribute(`id`, seats[j].seat);
                    syncSeatAccessibility(seatElement);
                    rowElement.appendChild(seatElement);
                };
            };
        };

        //create sector label
        const sectorLabel = document.createElement('span');
        sectorLabel.textContent = sectorId;
        sectorLabel.classList.add('sector__label');
        sectorElement.appendChild(sectorLabel);
    };
};

// ACCESSIBILITY HELPERS ------------------------------------------------------
function syncSeatAccessibility(seat) {
    const seatId = seat.id;
    if (seat.classList.contains('seat--booked')) {
        seat.disabled = true;
        seat.setAttribute('aria-pressed', 'false');
        seat.setAttribute('aria-label', `Seat ${seatId}, booked, not available`);
    } else if (seat.classList.contains('seat--reserved')) {
        seat.disabled = false;
        seat.setAttribute('aria-pressed', 'true');
        seat.setAttribute('aria-label', `Seat ${seatId}, selected`);
    } else {
        seat.disabled = false;
        seat.setAttribute('aria-pressed', 'false');
        seat.setAttribute('aria-label', `Seat ${seatId}, available`);
    }
}

function syncAllSeatsAccessibility() {
    document.querySelectorAll('.seat').forEach(syncSeatAccessibility);
}

function announceToScreenReader(message) {
    const statusRegion = document.querySelector('#sr-status');
    if (!statusRegion) return;
    statusRegion.textContent = '';
    window.setTimeout(() => {
        statusRegion.textContent = message;
    }, 50);
}

// CREATE SECTORS (name, priceMultiplier, ...seatsInRow) ----------------------
const sectorA1 = new Sector(`A1`, 1.0, 20, 20);
sectorA1.renderSector();

const sectorA2 = new Sector(`A2`, 1.2, 20, 20, 20);
sectorA2.renderSector();

const sectorB1 = new Sector(`B1`, 1.2, 20, 20, 20, 20);
sectorB1.renderSector();

const sectorB1L = new Sector(`B1L`, 1.4, 1, 1, 1, 1, 1, 1);
sectorB1L.renderSector();

const sectorB2L = new Sector(`B2L`, 1.4, 1, 1, 1, 1, 1, 1);
sectorB2L.renderSector();

const sectorC1L = new Sector(`C1L`, 1.5, 12);
sectorC1L.renderSector();

// UTILITY FUNCTIONS ----------------------------------------------------------
const localStorageSpace = function(){
    let data = '';

    console.log('Current local storage: ');
    for(let key in window.localStorage){
        if(window.localStorage.hasOwnProperty(key)){
            data += window.localStorage[key];
            console.log( key + " = " + ((window.localStorage[key].length * 16)/(8 * 1024)).toFixed(2) + ' KB' );
        }
    }

    console.log(data ? '\n' + 'Total space used: ' + ((data.length * 16)/(8 * 1024)).toFixed(2) + ' KB' : 'Empty (0 KB)');
    console.log(data ? 'Approx. space remaining: ' + (5120 - ((data.length * 16)/(8 * 1024)).toFixed(2)) + ' KB' : '5 MB');
};

// APP FUNCTIONS --------------------------------------------------------------
function initializeApp(instanceName) {
    console.log(`Seat-Booking App instance "${instanceName}" has been successfully created!`);
    return new SeatBookingApp(instanceName);
};

function renderBookedSeats() {
    if(showingRoom1.getCurrentService()) {
        const bookedSeats = showingRoom1.getCurrentService().getBookedSeats();
        const seatElements = document.querySelectorAll('.seat');
        seatElements.forEach((seat) => {
            if(bookedSeats.includes(seat.id)) {
                seat.classList.remove(`seat--reserved`);
                seat.classList.add(`seat--booked`);
            } else {
                seat.classList.remove(`seat--booked`);
            }
            syncSeatAccessibility(seat);
        });
    }
};

// INITIALIZE APP -------------------------------------------------------------
const showingRoom1 = initializeApp(`showingRoom1`);
// add sectors
showingRoom1.addSector(sectorA1)
showingRoom1.addSector(sectorA2)
showingRoom1.addSector(sectorB1)
showingRoom1.addSector(sectorB1L)
showingRoom1.addSector(sectorB2L)
showingRoom1.addSector(sectorC1L)
// create initial price multipliers array
showingRoom1.setPriceMultipliersArray()
// fetch Services from localStorage
showingRoom1.fetchServices();
// render user interface
showingRoom1.renderSectorsList();
showingRoom1.renderServicesList();
showingRoom1.renderCurrentServiceData();
renderBookedSeats();
syncAllSeatsAccessibility();
showingRoom1.updateOrderDetails();

// GET ELEMENTS FROM DOM ------------------------------------------------------
const seatElements = document.querySelectorAll('.seat');
seatElements.forEach((seat) => {
    seat.addEventListener('mouseover', (e) => {
        if (e.target.disabled) return;
        const seatInfo = document.createElement('div');
        seatInfo.classList.add(`seat__info`);
        seatInfo.setAttribute('aria-hidden', 'true');
        seatInfo.textContent = e.target.id;
        e.target.parentElement.appendChild(seatInfo);
    });
    seat.addEventListener('mouseleave', (e) => {
        const row = e.target.parentElement;
        const tooltip = row.querySelector(`.seat__info`);
        if (tooltip) tooltip.remove();
    });
    seat.addEventListener('click', (e) => {
        const seatButton = e.currentTarget;
        if (seatButton.classList.contains(`seat--booked`)) return;

        const currentService = showingRoom1.getCurrentService();
        if (!currentService) {
            announceToScreenReader('Select or create a movie service before choosing seats.');
            return;
        }

        seatButton.classList.toggle('seat--reserved');
        if(seatButton.classList.contains(`seat--reserved`)) {
            currentService.addReservedSeat(seatButton);
            announceToScreenReader(`Seat ${seatButton.id} selected.`);
        } else {
            currentService.removeReservedSeat(seatButton.id);
            announceToScreenReader(`Seat ${seatButton.id} deselected.`);
        }
        syncSeatAccessibility(seatButton);
        showingRoom1.updateOrderDetails();
    });
});

// get `current service` dropdown element
const dropdownElement = document.querySelector(`#services-list`);
dropdownElement.addEventListener('change', (e) => {
    showingRoom1.setCurrentServiceId(e.target.value);
    renderBookedSeats();
    showingRoom1.renderCurrentServiceData();
    showingRoom1.updateOrderDetails();
    announceToScreenReader(`Now booking seats for ${e.target.selectedOptions[0].textContent}.`);
})

// get `add new Service` button element
const serviceAddBtn = document.querySelector(`#service-add-btn`);
serviceAddBtn.addEventListener('click', (e) => {
    // get input elements
    const inputServiceName = document.querySelector(`#service-name`).value;
    const inputServicePrice = document.querySelector(`#service-price`).value;
    // create new Service instance
    const newService = new Service(inputServiceName, inputServicePrice)

    showingRoom1.addService(newService);
    showingRoom1.cacheServices();
    showingRoom1.renderServicesList();
    showingRoom1.renderCurrentServiceData();

    console.log(`"${inputServiceName}" has been successfully added`)
    localStorageSpace();
})

// get `update Service` button element
const serviceUpdateBtn = document.querySelector(`#service-update-btn`);
serviceUpdateBtn.addEventListener('click', () => {
    // get input elements
    const inputServiceName = document.querySelector(`#service-name`).value;
    const inputServicePrice = document.querySelector(`#service-price`).value;
    // get current service
    const currentService = showingRoom1.getCurrentService();
    currentService.setName(inputServiceName);
    currentService.setPrice(inputServicePrice);

    showingRoom1.cacheServices();
    showingRoom1.renderCurrentServiceData();

    console.log(`"${inputServiceName}" has been successfully updated`)
    localStorageSpace();
})

// get `delete Service` button element
const serviceDeleteBtn = document.querySelector(`#service-delete-btn`);
serviceDeleteBtn.addEventListener('click', () => {

    // get current service name
    const inputServiceName = document.querySelector(`#service-name`).value;
    // get current service ID
    const currentServiceId = showingRoom1.getCurrentServiceId();
    // get all services array
    const servicesArray = showingRoom1.getServicesArray();
    const indexToDelete = servicesArray.findIndex((service) => {
        return service.getId() === currentServiceId;
    })
    // remove current service from array
    servicesArray.splice(indexToDelete, 1)

    showingRoom1.cacheServices();
    showingRoom1.renderServicesList()
    showingRoom1.renderCurrentServiceData();

    console.log(`"${inputServiceName}" has been successfully removed`)
    localStorageSpace();
})

// get `book seats` button element
const bookSeatsBtn = document.querySelector(`#book-seats-btn`)
bookSeatsBtn.addEventListener('click', () => {
    const currentService = showingRoom1.getCurrentService();
    if (!currentService) {
        announceToScreenReader('No movie service selected. Cannot complete purchase.');
        return;
    }

    const reservedCount = currentService.getReservedSeats().length;
    if (reservedCount === 0) {
        announceToScreenReader('Select at least one seat before buying tickets.');
        return;
    }

    currentService.bookSeats();
    showingRoom1.cacheServices();
    showingRoom1.updateOrderDetails();
    syncAllSeatsAccessibility();
    announceToScreenReader(`${reservedCount} ticket${reservedCount === 1 ? '' : 's'} purchased successfully.`);
});