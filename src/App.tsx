import { ReportDesigner } from './report-designer/ReportDesigner'

function App() {
  const customFields = ['NOME_CLIENTE', 'VALOR_TOTAL', 'DATA_VENCTO', 'DOCUMENTO'];

  return (
    <ReportDesigner 
      dataFieldsSchema={customFields} 
      onSave={(report) => {
        alert('O JSON foi retornado para o Componente Pai do ERP! Confira o Console.');
        console.log('JSON Salvo do Designer: ', report);
      }}
    />
  )
}

export default App
