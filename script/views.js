'use strict';

function renderSectorsList(sectors) {
    const container = document.querySelector('#sectors-list');
    container.innerHTML = '';

    sectors.forEach((sector) => {
        const listElement = document.createElement('li');
        const name = document.createElement('span');
        name.textContent = sector.sector;
        const price = document.createElement('input');
        price.setAttribute('id', `price-${sector}`);
        price.value = sector.priceMultiplier;
        listElement.appendChild(name);
        listElement.appendChild(price);
        container.appendChild(listElement);
    });
}

function renderServicesList(services) {
    const dropdownElement = document.querySelector('#services-list');
    dropdownElement.innerHTML = '';

    services.forEach((service) => {
        const optionElement = document.createElement('option');
        optionElement.setAttribute('value', service.getId());
        optionElement.textContent = service.getName();
        dropdownElement.appendChild(optionElement);
    });

    return dropdownElement.value;
}

function renderCurrentServiceData(currentService) {
    if (currentService) {
        const inputServiceName = document.querySelector('#service-name');
        const inputServicePrice = document.querySelector('#service-price');
        inputServiceName.value = currentService.getName();
        inputServicePrice.value = currentService.getPrice();
    }
}

function renderOrderDetails(currentService, priceMultipliers) {
    const container = document.querySelector('#order-details');
    container.innerHTML = '';

    const totalPriceContainer = document.querySelector('#order-total-price');
    totalPriceContainer.innerHTML = '';

    if (!currentService) {
        return;
    }

    const servicePrice = currentService.getPrice();
    const reservedSeats = currentService.getReservedSeats();
    let totalPrice = 0;

    reservedSeats.forEach((seat) => {
        const currentSecotrId = seat.parentElement.parentElement.id;
        const sectorPrice = priceMultipliers.find((element) => {
            return element.sector === currentSecotrId;
        }).priceMultiplier;
        const seatPrice = parseFloat((servicePrice * sectorPrice).toFixed(2));
        totalPrice += seatPrice;

        const listItem = document.createElement('li');
        const listItemId = document.createElement('span');
        listItemId.textContent = seat.id;
        const listItemPrice = document.createElement('span');
        listItemPrice.textContent = `$${seatPrice}`;
        container.appendChild(listItem);
        listItem.appendChild(listItemId);
        listItem.appendChild(listItemPrice);

        const totalPriceElement = document.createElement('span');
        totalPriceElement.textContent = `Total price: $${parseFloat(totalPrice.toFixed(2))}`;
        totalPriceContainer.innerHTML = '';
        totalPriceContainer.appendChild(totalPriceElement);
    });
}

function renderSector(sector) {
    const seatsContainer = document.querySelector('#seats');
    if (!seatsContainer) throw Error('Seats container not found');

    const sectorId = sector.getId();
    const sectorName = sectorId.slice(2);
    const seats = sector.getSeats();

    const sectorElement = document.createElement('div');
    sectorElement.classList.add('sector');
    sectorElement.setAttribute('id', sectorId);
    sectorElement.style.gridArea = sectorName;
    seatsContainer.appendChild(sectorElement);

    for (let i = 0; i < sector.getRowsCount(); i++) {
        const rowElement = document.createElement('div');
        rowElement.classList.add('row');
        rowElement.setAttribute('id', `${sectorId}-${i + 1}`);
        sectorElement.appendChild(rowElement);

        for (let j = 0; j < seats.length; j++) {
            if (seats[j].row === `${sectorId}-${i + 1}`) {
                const seatElement = document.createElement('div');
                seatElement.classList.add('seat');
                seatElement.setAttribute('id', seats[j].seat);
                rowElement.appendChild(seatElement);
            }
        }
    }

    const sectorLabel = document.createElement('span');
    sectorLabel.textContent = sectorId;
    sectorLabel.classList.add('sector__label');
    sectorElement.appendChild(sectorLabel);
}

function markBookedSeats(bookedSeats) {
    const seatElements = document.querySelectorAll('.seat');
    seatElements.forEach((seat) => {
        if (bookedSeats.includes(seat.id)) {
            seat.classList.remove('seat--reserved');
            seat.classList.add('seat--booked');
        }
    });
}

function renderBookedSeats(bookedSeats) {
    const seatElements = document.querySelectorAll('.seat');
    seatElements.forEach((seat) => {
        if (bookedSeats.includes(seat.id)) {
            seat.classList.add('seat--booked');
        } else {
            seat.classList.remove('seat--booked');
        }
    });
}
