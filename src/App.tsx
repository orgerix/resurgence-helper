import { useEffect, useState } from 'react'
import  {Item, loadRelics, Rarity, Relic, RelicReward} from './Types.ts'
import computeProbabilities from './Math.ts'
import './App.css'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';

import { Input, MenuItem, Paper, Select, SelectChangeEvent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'

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
  changeHandler: (relicName: string, rewards: [Item, number][], amount: number) => void | undefined
}

function RelicGrid(props: RelicGridProps) {
    const [runMethod, setRunMethod] = useState('');
    const [amount, setAmount] = useState("1");
    const [positions, setPositions] = useState(new Map(props.relic.rewards.map((r, i) => [r.item.id, i])));
    const handleRunChange = (event: SelectChangeEvent) => {
      setRunMethod(event.target.value as string);
    };

    const rewards = [...props.relic.rewards].sort((a,b) => (positions.get(a.item.id) ?? 0) - (positions.get(b.item.id) ?? 0))
    
    const probas = runMethod === "" ? undefined : computeProbabilities(runMethod, rewards)

    if (probas !== undefined && props.changeHandler !== undefined) {
      const parsed = parseInt(amount)
      if (!Number.isNaN(parsed)) {
          props.changeHandler(props.relic.name, rewards.map((r, i) => [r.item, probas[i]]), parsed);
      }
    }
  
    return (<div>
        Amount: <TextField value={amount} onChange={(event: React.ChangeEvent<HTMLInputElement>) => { setAmount(event.target.value); }}></TextField>
        Run method: <Select autoWidth value={runMethod} onChange={handleRunChange}>
          <MenuItem value="2b2i">2b2i</MenuItem>
          <MenuItem value="4b4i">4b4i</MenuItem>
          <MenuItem value="2b2f">2b2f</MenuItem>
          <MenuItem value="4b4f">4b4f</MenuItem>
          <MenuItem value="2b2r">2b2r</MenuItem>
          <MenuItem value="4b4r">4b4r</MenuItem>
        </Select>
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
                key={reward.item.name}
                sx={{ "backgroundColor": toColor(reward.rarity) }}
              >
                <TableCell component="th" scope="row">
                  {reward.item.name}
                </TableCell>
                <TableCell align="right">{reward.item.set}</TableCell>
                <TableCell align="right"><TextField  value={positions.get(reward.item.id)} onChange={ createPriorityChangeHandler(reward) }></TextField></TableCell>
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
      console.log(parsed);
      if (Number.isNaN(parsed)) {
        return;
      }
      setPositions((oldValues) => {
        const newValues = new Map(oldValues);
        newValues.set(reward.item.id, parsed);
        return newValues;
      });
    }
  }
}

class RelicTabsProps {
  relics: Relic[]
  changeHandler: (relicName: string, rewards: [Item, number][], amount: number) => void | undefined
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
  const tabPanel = props.relics.map(relic => (<TabPanel value={relic.name}><RelicGrid relic={relic} changeHandler={props.changeHandler} /></TabPanel>));

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


function App() {
  const [state, setState] = useState(new Map<string, Relic>);
  const selected: Relic[] = []
  const [relics, setRelics] = useState(selected);
  const [gatheredData, setGatheredData] = useState(new Map<string, [[Item, number][], number]>)
  useEffect(() => {
      async function loadData() {
        const relics = await loadRelics();
        console.log(relics.size);
        setState(relics);
      }
      loadData()
    }, [])
  const autoCompleteOptions = [... state.values()]

  console.log(gatheredData);

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
        onChange={(event, values) => setRelics(values)}
      />
      <RelicTabs relics={relics} changeHandler={(e, r, v) => console.log(e,r,v)
      /*setGatheredData(oldState => {
        const newState = new Map<string, [[Item, number][], number]>(oldState);
        newState.set(e, [r, v]);
        return newState;
      })*/} />
    </div>
  )
}

export default App
