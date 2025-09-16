import { JSX, useCallback, useEffect, useState } from 'react'
import  {Item, loadRelics, Rarity, Relic, RelicReward} from './Types.ts'
import {computeProbabilities, parseRunMethod, Run} from './Math.ts'
import './App.css'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';

import { Button, Checkbox, Input, MenuItem, Paper, Select, SelectChangeEvent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import RelicState from './RelicState.ts'

function toColor(rarity: Rarity) {
  switch (rarity) {
    case Rarity.Gold:
      return "#ede2c5";
    case Rarity.Silver:
      return "#d1d1d1";
    case Rarity.Bronze:
      return "#fce1c5";
    default:
      return "#ffffff";
  }
}

class RelicGridProps {
  relic: Relic
  changeHandler: (relicName: string, rewards: [Item, number][]) => void
}

function RelicGrid(props: RelicGridProps) {
    const [state, setState] = useState(new RelicState(props.relic))
    const handleRunChange = (event: SelectChangeEvent) => {
      setState(old => {
        const newState = {... old}
        newState.run = parseRunMethod(event.target.value as string)
        if (newState.run.nbOffcycleRelicsPerRun() > 0) {
          newState.offcycle = undefined;
        }
        return newState;
      });
    };
    const handleOffcycleChange = (event: SelectChangeEvent) => { 
       setState(old => {
        const newState = {... old}
        newState.offcycle = event.target.value as string
        return newState;
       });
    };
    const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => { setState(old => {
        const newState = {... old}
        newState.amount = parseInt(event.target.value);
        return newState;
    });}

    const rewards = [...props.relic.rewards].sort((a,b) => (state.positions.get(a.item.id) ?? 0) - (state.positions.get(b.item.id) ?? 0))
    
    const probas = state.run === undefined ? undefined : computeProbabilities(state.run, rewards, state.offcycle)

    useEffect(() => {
      if (probas !== undefined && props.changeHandler !== undefined) {
        if (!Number.isNaN(state.amount)) {
          props.changeHandler(props.relic.name, rewards.map((r, i) => [r.item, probas[i] * (state.amount ?? 1)]));
        }
      }
    }, [state]);
  
    return (<div>
        Amount: <TextField value={state.amount ?? 1} onChange={handleAmountChange}></TextField>
        Run method: <Select autoWidth value={state.run?.asString() ?? ""} onChange={handleRunChange}>
          <MenuItem value="2b2i">2b2i</MenuItem>
          <MenuItem value="4b4i">4b4i</MenuItem>
          <MenuItem value="2b2f">2b2f</MenuItem>
          <MenuItem value="4b4f">4b4f</MenuItem>
          <MenuItem value="2b2r">2b2r</MenuItem>
          <MenuItem value="4b4r">4b4r</MenuItem>
        </Select>
        { state.run !== undefined && state.run.nbOffcycleRelicsPerRun() > 0 &&
        (<span>Favor offcycle gold before: <Select value={state.offcycle ?? ""} onChange={handleOffcycleChange} autoWidth>
          {rewards.map(r => (<MenuItem value={r.item.id}>{r.item.name}</MenuItem>))}
        </Select></span>)}
        <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell align="right">Set</TableCell>
              <TableCell align="right">Priorty</TableCell>
              <TableCell align="right">Expected Reward</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rewards.map((reward, i) => (
              <TableRow
                key={reward.item.id}
                sx={{ "backgroundColor": toColor(reward.rarity) }}
              >
                <TableCell component="th" scope="row">
                  {reward.item.name}
                </TableCell>
                <TableCell align="right">{reward.item.set}</TableCell>
                <TableCell align="right"><TextField  value={state.positions.get(reward.item.id)} onChange={ createPriorityChangeHandler(reward) }></TextField></TableCell>
                <TableCell align="right">{probas !== undefined && probas[i].toLocaleString(undefined, { maximumFractionDigits: 3 })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>);

  function createPriorityChangeHandler(reward: RelicReward) {
    return (event) => {
      const parsed = parseInt(event.target.value);
      if (Number.isNaN(parsed)) {
        return;
      }
      setState((old) => {
        const newState = {... old}
        newState.positions = new Map(newState.positions);
        newState.positions.set(reward.item.id, parsed);
        return newState;
      });
    }
  }
}

class RelicTabsProps {
  relics: Relic[]
  changeHandler: (relicName: string, rewards: [Item, number][]) => void
}

function RelicTabs(props: RelicTabsProps) {

  if (props.relics.length == 0) {
    return <Box></Box>;
  }

  const [value, setValue] = useState(props.relics[0].name);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const tabs = props.relics.map(relic => (<Tab label={relic.name} value={relic.name} />));
  const tabPanel = props.relics.map(relic => (<TabPanel key={relic.name} value={relic.name}><RelicGrid relic={relic} changeHandler={props.changeHandler} /></TabPanel>));

  return (<Box>
        <TabContext value={value}>
          <Box>
            <TabList onChange={handleChange}>
              {tabs}
            </TabList>
          </Box>
          {tabPanel}
        </TabContext>
      </Box>);
}

class RecapProps {
  data: Map<string, [Item, number][]>
}

function Recap(props: RecapProps) {
  const perSet = new Map<string, Map<String, number>>();

  props.data.forEach((value) => {
    value.forEach(elem => {
      if (elem[0].set === undefined) {
        return;
      }
      let map = perSet.get(elem[0].set);
      if (map === undefined) {
        map = new Map<String, number>();
        perSet.set(elem[0].set, map);
      }
      const count = map.get(elem[0].name) || 0;
      map.set(elem[0].name, count + elem[1]);
    })
  });

  const setRows: JSX.Element[] = []
  perSet.forEach((items, setName) => {
    const itemRows: JSX.Element[] = []
    items.forEach((number, itemName) => {
      itemRows.push((
        <TableRow>
          <TableCell>{itemName}</TableCell>
          <TableCell align="right">{number.toLocaleString(undefined, { maximumFractionDigits: 1 })}</TableCell>
        </TableRow>
      ))
    })
    setRows.push((
      <TableRow key={setName}>
        <TableCell>{setName}</TableCell><TableCell><Table><TableBody>{itemRows}</TableBody></Table></TableCell>
      </TableRow>))
          });

  return (
    <Box>
      <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>Set</TableCell>
            <TableCell>Parts</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {setRows}
        </TableBody>
      </Table>
    </Box>);
}

function App() {
  const [state, setState] = useState(new Map<string, Relic>);
  const selected: Relic[] = []
  const [relics, setRelics] = useState(selected);
  const [gatheredData, setGatheredData] = useState(new Map<string, [Item, number][]>)
  useEffect(() => {
      async function loadData() {
        const relics = await loadRelics();
        setState(relics);
      }
      loadData()
    }, [])
  const autoCompleteOptions = [... state.values()]

  return (
    <div>
      <Autocomplete
        disablePortal
        multiple 
        options={autoCompleteOptions}
        getOptionLabel={(option) => option.name}
        groupBy={(option) => option.era.toString()}
        sx={{ width: 300 }}
        renderInput={(params) => <TextField {...params} label="Relic" />}
        onChange={(event, values) => {
          setRelics(values);
          setGatheredData(oldData => {
            const newData = new Map<string, [Item, number][]>();
            values.forEach(relic => {
              newData.set(relic.name, oldData.get(relic.name) ?? [])
            });
            return newData;
          })
        }}
      />
      <RelicTabs relics={relics} changeHandler={(e, r) => {
        console.log(e,r);
        setGatheredData(oldState => {
          const newState = new Map<string, [Item, number][]>(oldState);
          newState.set(e, r);
          return newState;
        });
      }} />
      <Recap data={gatheredData} />
    </div>
  )
}

export default App
