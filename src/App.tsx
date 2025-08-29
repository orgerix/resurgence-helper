import { useEffect, useState } from 'react'
import  {loadRelics, Rarity, Relic, RelicReward} from './Types.ts'
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
}

function RelicGrid(props: RelicGridProps) {
    const [runMethod, setRunMethod] = useState('');
    const [positions, setPositions] = useState<[string, number][]>(props.relic.rewards.map((r, i) => [r.item.id, i]))
    const handleRunChange = (event: SelectChangeEvent) => {
      setRunMethod(event.target.value as string);
    };

    const indexedPosition = new Map<string, number>(positions.map(e => e))

    const rewards = [...props.relic.rewards].sort((a,b) => (indexedPosition.get(a.item.id) ?? 0) - (indexedPosition.get(b.item.id) ?? 0))
    
    const probas = runMethod === "" ? undefined : computeProbabilities(runMethod, rewards)

    return (<div>
        Amount: <TextField></TextField>
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
                <TableCell align="right"><TextField  value={indexedPosition.get(reward.item.id)} onChange={ createPriorityChangeHandler(reward) }></TextField></TableCell>
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
      setPositions(positions.map(e => e[0] === reward.item.id ? [e[0], parseInt(event.target.value)] : [e[0], e[1]]))
    }
  }
}

function RelicTabs({relics}) {

  if (relics.length == 0) {
    return <Box></Box>;
  }

  const [value, setValue] = useState(relics[0].name);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const tabs = relics.map(relic => (<Tab label={relic.name} value={relic.name} />));
  const tabPanel = relics.map(relic => (<TabPanel value={relic.name}><RelicGrid relic={relic} /></TabPanel>));

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
  useEffect(() => {
      async function loadData() {
        const relics = await loadRelics();
        console.log(relics.size);
        setState(relics);
      }
      loadData()
    }, [])
  const autoCompleteOptions = [... state.values()]

  let i = 1

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
      <RelicTabs relics={relics}/>
    </div>
  )
}

export default App
