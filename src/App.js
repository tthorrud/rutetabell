import React, {useEffect, useState} from 'react';
import logo from './logo.svg';
import './App.css';
import {format, differenceInMinutes} from 'date-fns'

function App() {

  const [newestRutetider, setNewestRutetider] = useState(null);
  const [fetchQueue, updateFetchQueue] = useState([]);

  console.log('state', newestRutetider);
  console.log('queue', fetchQueue);

  const putOnQueue = () => {
    if (fetchQueue.length < 1) {
      console.log("skal skje noe her")
      updateFetchQueue([createRequest]);
    } else if (fetchQueue.length >= 1) {
      console.log('nå har vi kø', fetchQueue);
      const copyQueue = fetchQueue;
      updateFetchQueue([copyQueue.shift(), createRequest]);
    }
  };

  useEffect(() => {
    if (fetchQueue.length === 1 ) {
      fetchQueue[0]();
    }
  }, [fetchQueue]);

  useEffect(() => {
    console.log("KUN SKJE 1 GANG")
    putOnQueue();
    const interval = setInterval(() => {
      console.log("KJorer hvert femte sekund");
      putOnQueue();
    }, 10000);
    return () => clearInterval(interval);
  }, []);


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
            const oldQueue = [...fetchQueue];
            oldQueue.shift();
            updateFetchQueue(oldQueue);
            return setNewestRutetider(res.data)
        });
  };

  const sleep = async () => {
    return await new Promise(r => setTimeout(r, 11000));
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

  return (
    <div className="App">
      <header className="App-header">
        <table className="rute-tabell">
          <thead>
          <tr>
            <th>Destinasjon</th>
            <th>Avgang</th>
            <th>Forventet ankomst</th>
            <th>Forsinket</th>
          </tr>
          </thead>
          <tbody>
            { newestRutetider && newestRutetider.stopPlace && newestRutetider.stopPlace.estimatedCalls &&
            newestRutetider.stopPlace.estimatedCalls.map(r => destinationRow(r))
            }
          </tbody>
        </table>
      </header>
    </div>
  );
}

export default App;
