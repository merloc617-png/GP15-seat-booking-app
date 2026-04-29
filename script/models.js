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
        const sectors = this.getSectorsArray();
        sectors.forEach((sector) => {
            const sectorId = sector.getId();
            const sectorPrice = sector.getPriceMultiplier();
            this._priceMultipliers.push({
                sector: sectorId,
                priceMultiplier: sectorPrice
            });
        });
    }
    getPriceMultipliersArray() {
        return this._priceMultipliers;
    }
    addService(service) {
        this._services.push(service);
    }
    getServicesArray() {
        return this._services;
    }
    getCurrentServiceId() {
        return this._currentServiceId;
    }
    getCurrentService() {
        const services = this.getServicesArray();
        return services.find((service) => {
            return service.getId() === this.getCurrentServiceId();
        });
    }
    setCurrentServiceId(serviceId) {
        this._currentServiceId = serviceId;
    }
    cacheServices() {
        if (typeof (Storage) !== 'undefined') {
            localStorage.setItem(`sba-services-${this.getName()}`, JSON.stringify(this.getServicesArray()));
        } else {
            window.alert('Access to localStorage in this browser is not available. Data cannot be saved.');
            throw Error('Access to localStorage in this browser is not available. Data cannot be saved.');
        }
    }
    fetchServices() {
        const servicesJSON = JSON.parse(localStorage.getItem(`sba-services-${this.getName()}`));

        if (!servicesJSON) {
            console.log("Let's add some services. Use the form on the left.");
        } else {
            servicesJSON.forEach((service) => {
                const serviceInstance = new Service(service._name, service._price);
                serviceInstance.setBookedSeatsArray(service._seatsBooked);
                this.addService(serviceInstance);
            });
        }
    }
}

class Service {
    constructor(name, price) {
        this._id = crypto.randomUUID();
        this._name = name;
        this._price = price;
        this._seatsReserved = [];
        this._seatsBooked = [];
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
        const reservedSeats = this.getReservedSeats();
        reservedSeats.forEach((seat) => {
            this._seatsBooked.push(seat.id);
        });
        this.clearReservedSeats();
        markBookedSeats(this._seatsBooked);
    }
    getReservedSeats() {
        return this._seatsReserved;
    }
    addReservedSeat(seat) {
        this._seatsReserved.push(seat);
    }
    removeReservedSeat(seatId) {
        const index = this._seatsReserved.findIndex((seat) => {
            return seat === seatId;
        });
        this._seatsReserved.splice(index, 1);
    }
    clearReservedSeats() {
        this._seatsReserved = [];
    }
    setBookedSeatsArray(array) {
        this._seatsBooked = array;
    }
}

class Sector {
    constructor(id, priceMultiplier = 1, ...seatsInRow) {
        this._id = `s-${String(id)}`;
        this._priceMultiplier = priceMultiplier;
        this._rows = seatsInRow.length;
        this._seats = [...seatsInRow];

        for (let i = 1; i <= seatsInRow.length; i++) {
            const rowId = `${this._id}-${i}`;

            for (let j = 1; j <= seatsInRow[i - 1]; j++) {
                const seatId = `${rowId}-${j}`;
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
    getRowsCount() {
        return this._rows;
    }
    getSeats() {
        return this._seats;
    }
}
