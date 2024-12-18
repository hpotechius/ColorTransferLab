import "./SettingsFieldItem.scss";

function SettingsFieldItem(props) {

    return(
        <tr className="field_settings_item">
            <td className='field_settings_table_cell'>{props.children}</td>
            <td className='field_settings_table_cell'>
                <input 
                    type={props.type}
                    defaultChecked={props.default}
                    onChange={props.onChange} 
                    {...(props.type !== 'range' ? { defaultChecked: props.default } : {})}
                    {...(props.type === 'range' ? { 
                        min: props.min, 
                        max: props.max, 
                        ...(props.default !== undefined ? { defaultValue: props.default } : {}),
                        ...(props.value !== undefined ? { value: props.value } : {})
                    } : {})}
                />
            </td>
        </tr>
    )
}

export default SettingsFieldItem;