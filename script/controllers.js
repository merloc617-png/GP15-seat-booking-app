'use strict';

function initializeApp(instanceName) {
    console.log(`Seat-Booking App instance "${instanceName}" has been successfully created!`);
    return new SeatBookingApp(instanceName);
}

function renderBookedSeatsForCurrentService(app) {
    if (app.getCurrentService()) {
        renderBookedSeats(app.getCurrentService().getBookedSeats());
    }
}

function bindSeatEvents(app) {
    const seatElements = document.querySelectorAll('.seat');
    seatElements.forEach((seat) => {
        seat.addEventListener('mouseover', (e) => {
            const seatInfo = document.createElement('div');
            seatInfo.classList.add('seat__info');
            seatInfo.textContent = e.target.id;
            e.target.parentElement.appendChild(seatInfo);
        });

        seat.addEventListener('mouseleave', () => {
            const seatInfo = document.querySelector('.seat__info');
            if (seatInfo) {
                seatInfo.remove();
            }
        });

        seat.addEventListener('click', (e) => {
            if (!seat.classList.contains('seat--booked')) {
                e.target.classList.toggle('seat--reserved');
                const currentService = app.getCurrentService();
                if (seat.classList.contains('seat--reserved')) {
                    currentService.addReservedSeat(e.target);
                    renderOrderDetails(app.getCurrentService(), app.getPriceMultipliersArray());
                } else {
                    currentService.removeReservedSeat(e.target.id);
                }
            }
        });
    });
}

function bindServiceControls(app) {
    const dropdownElement = document.querySelector('#services-list');
    dropdownElement.addEventListener('change', (e) => {
        app.setCurrentServiceId(e.target.value);
        renderBookedSeatsForCurrentService(app);
        renderCurrentServiceData(app.getCurrentService());
    });

    const serviceAddBtn = document.querySelector('#service-add-btn');
    serviceAddBtn.addEventListener('click', () => {
        const inputServiceName = document.querySelector('#service-name').value;
        const inputServicePrice = document.querySelector('#service-price').value;
        const newService = new Service(inputServiceName, inputServicePrice);

        app.addService(newService);
        app.cacheServices();
        app.setCurrentServiceId(renderServicesList(app.getServicesArray()));
        renderCurrentServiceData(app.getCurrentService());

        console.log(`"${inputServiceName}" has been successfully added`);
        localStorageSpace();
    });

    const serviceUpdateBtn = document.querySelector('#service-update-btn');
    serviceUpdateBtn.addEventListener('click', () => {
        const inputServiceName = document.querySelector('#service-name').value;
        const inputServicePrice = document.querySelector('#service-price').value;
        const currentService = app.getCurrentService();
        currentService.setName(inputServiceName);
        currentService.setPrice(inputServicePrice);

        app.cacheServices();
        renderCurrentServiceData(app.getCurrentService());

        console.log(`"${inputServiceName}" has been successfully updated`);
        localStorageSpace();
    });

    const serviceDeleteBtn = document.querySelector('#service-delete-btn');
    serviceDeleteBtn.addEventListener('click', () => {
        const inputServiceName = document.querySelector('#service-name').value;
        const currentServiceId = app.getCurrentServiceId();
        const servicesArray = app.getServicesArray();
        const indexToDelete = servicesArray.findIndex((service) => {
            return service.getId() === currentServiceId;
        });
        servicesArray.splice(indexToDelete, 1);

        app.cacheServices();
        app.setCurrentServiceId(renderServicesList(app.getServicesArray()));
        renderCurrentServiceData(app.getCurrentService());

        console.log(`"${inputServiceName}" has been successfully removed`);
        localStorageSpace();
    });

    const bookSeatsBtn = document.querySelector('#book-seats-btn');
    bookSeatsBtn.addEventListener('click', () => {
        const currentService = app.getCurrentService();
        currentService.bookSeats();
        app.cacheServices();
    });
}
