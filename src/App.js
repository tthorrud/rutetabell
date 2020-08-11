import React, {useEffect, useState} from 'react';
import './App.css';
import {format, differenceInMinutes} from 'date-fns'

function App() {

  const [newestRutetider, setNewestRutetider] = useState(null);
  const [fetchQueue, updateFetchQueue] = useState([]);

  //Hvis køen er tom skal ny kø være ett nytt request, mens hvis køen allerede har et eller flere requests, skal den
  //nye køen bestå av det første requestet i nåværende kø pluss et nytt request.
  const putOnQueue = () => {
    if (fetchQueue.length < 1) {
      updateFetchQueue([createRequest]);
    } else if (fetchQueue.length >= 1) {
      const copyQueue = fetchQueue;
      updateFetchQueue([copyQueue.shift(), createRequest]);
    }
  };

  //Kjører hver gang køen har blitt oppdatert. Dersom et kall har fått respons og det ligger et ventende kall i køen,
  // vil køen ha blitt redusert fra 2 til 1 element - og kallet som er igjen i køen skal bli kjørt.
  useEffect(() => {
    if (fetchQueue.length === 1 ) {
      fetchQueue[0]();
    }
  }, [fetchQueue]);

  //Setter et kall i køen ved første render og legger deretter til et kall hvert 5. sekund
  useEffect(() => {
    putOnQueue();
    const interval = setInterval(() => {
      putOnQueue();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const removeExecutedAPIRequest = () => {
    const oldQueue = [...fetchQueue];
    oldQueue.shift();
    updateFetchQueue(oldQueue);
  };

  //Metode som eksekverer et API kall og deretter fjerner første kall i køen. Hvis kallet returnerer feil ryddes fortsatt
  //køen, og resultat fra forrige vellykket kall blir stående i rutetabellen.
  const createRequest = () => {
    fetch("https://api.entur.io/journey-planner/v2/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ET-Client-Name": "test"
      },
      body: JSON.stringify({
        query: `{ 
          stopPlace(id: "NSR:StopPlace:4000") { 
            id 
            name 
            estimatedCalls(startTime:"${new Date().toISOString()}" timeRange: 72100, numberOfDepartures: 10) { 
              realtime 
              aimedArrivalTime 
              expectedArrivalTime 
              date 
              destinationDisplay { 
                frontText 
              } 
            } 
          } 
        }`
      })
    })
        .then(res => res.json())
        .then(res => {
            removeExecutedAPIRequest();
            return setNewestRutetider(res.data)
        })
        .catch(error => removeExecutedAPIRequest());
  };

  const destinationRow = (destinationData) => {
    return (
        <tr key={`${destinationData.destinationDisplay.frontText}-${destinationData.aimedArrivalTime}`}>
          <td>{destinationData.destinationDisplay.frontText}</td>
          <td>{format(new Date(destinationData.aimedArrivalTime), 'H.mm')}</td>
          <td>{format(new Date(destinationData.expectedArrivalTime), 'H.mm')}</td>
          <td>{`${differenceInMinutes(new Date(destinationData.expectedArrivalTime), new Date(destinationData.aimedArrivalTime))} min`}</td>
        </tr>
    )
  };

  const haveRutetider = () => {
    return newestRutetider && newestRutetider.stopPlace && newestRutetider.stopPlace.estimatedCalls;
  };

  return (
    <div className="App">
      <header className="App-header">
        <table>
          <thead>
          <tr>
            <th>Destinasjon</th>
            <th>Avgang</th>
            <th>Forventet avgang</th>
            <th>Forsinket</th>
          </tr>
          </thead>
          <tbody>
            { haveRutetider() && newestRutetider.stopPlace.estimatedCalls.map(r => destinationRow(r)) }
          </tbody>
        </table>
      </header>
    </div>
  );
}

export default App;
