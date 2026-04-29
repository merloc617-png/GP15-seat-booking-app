'use strict';

const sectors = createSectors();
sectors.forEach((sector) => {
    renderSector(sector);
});

const showingRoom1 = initializeApp('showingRoom1');
sectors.forEach((sector) => {
    showingRoom1.addSector(sector);
});
showingRoom1.setPriceMultipliersArray();
showingRoom1.fetchServices();
renderSectorsList(showingRoom1.getPriceMultipliersArray());
showingRoom1.setCurrentServiceId(renderServicesList(showingRoom1.getServicesArray()));
renderCurrentServiceData(showingRoom1.getCurrentService());
renderBookedSeatsForCurrentService(showingRoom1);

bindSeatEvents(showingRoom1);
bindServiceControls(showingRoom1);
