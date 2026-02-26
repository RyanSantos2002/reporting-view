import { ReportDesigner } from './report-designer/ReportDesigner'

function App() {
  return (
    <ReportDesigner 
      onSave={(report) => {
        alert('O JSON foi retornado para o Componente Pai do ERP! Confira o Console.');
        console.log('JSON Salvo do Designer: ', report);
      }}
    />
  )
}

export default App
