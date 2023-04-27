function fetchDataPlanets() {
  return new Promise(function (resolve, reject) {
    const fetchPromise = fetch('https://swapi.dev/api/planets');
    let resultingTableData = [];
    let allResidentsList = [];

    fetchPromise
      .then((response) => response.json())
      .then((planetsInfo) => planetsInfo.results)
      .then((planetsList) => {
        planetsList.forEach((planet) => {
          resultingTableData.push({
            planetName: planet.name,
            planetUrl: planet.url,
            residents: [],
          });
        });

        const allResidents = planetsList.flatMap(
          (planetItem) => planetItem.residents
        );
        return allResidents;
      })
      .then((allResidents) =>
        Promise.allSettled(
          allResidents.map((url) => {
            return fetch(url);
          })
        )
      )
      .then((rawResults) =>
        rawResults
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value)
      )
      .then((fulfilledResults) =>
        Promise.allSettled(
          fulfilledResults.map((fulfilledResult) => fulfilledResult.json())
        )
      )
      .then((residents) => residents.map((resident) => resident.value))
      .then((residents) => {
        residents.forEach((resident) => {
          const homeworldUrl = resident.homeworld;
          const planetIndex = resultingTableData.findIndex(
            ({ planetUrl }) => planetUrl === homeworldUrl
          );

          resultingTableData[planetIndex].residents.push(resident);
        });
      })
      .then(() => {
        function createResident(planetResidents) {
          const residentsList = planetResidents.residents.map((resident) => {
            return new Resident(
              planetResidents.planetName,
              resident.name,
              resident.species
            );
          });
          return residentsList;
        }
        allResidentsList = resultingTableData.flatMap((planetItem) =>
          createResident(planetItem)
        );
        return allResidentsList;
      })
      .then((residentsList) => {
        const allResidentsSpecies = residentsList.map((resident) => {
          return resident.species;
        });
        return allResidentsSpecies;
      })
      .then((allResidentsSpecies) =>
        Promise.allSettled(
          allResidentsSpecies.map((url) => {
            return fetch(url);
          })
        )
      )
      .then((rawResults) => {
        return rawResults.map((result) => result.value);
      })
      .then((fulfilledResults) =>
        Promise.allSettled(
          fulfilledResults.map((fulfilledResult) => fulfilledResult.json())
        )
      )
      .then((species) => {
        species.forEach((speciesItem) => {
          if (speciesItem.status === 'fulfilled') {
            const spesiesIndex = species.indexOf(speciesItem);
            allResidentsList[spesiesIndex].species = speciesItem.value.name;
          } else {
            const rejectedSpesiesIndex = species.indexOf(speciesItem);
            allResidentsList[rejectedSpesiesIndex].species = 'Human';
          }
        });
        return allResidentsList;
      })
      .then((allResidentsList) => resolve(allResidentsList))
      .catch((error) => console.log('Error', error));
  });
}

class Resident {
  constructor(planet, residentName, species) {
    this.planet = planet;
    this.resident = residentName;
    this.species = species;
  }
}

fetchDataPlanets().then((data) => console.table(data));
