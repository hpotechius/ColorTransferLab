#!/bin/bash

# Define the environment name and requirements file
ENV_NAME="../env"
REQUIREMENTS_FILE="../requirements/requirements.txt"

# -----------------------------------------------------------------------------------------------------------
# -----------------------------------------------------------------------------------------------------------
# Skip environment creation
if [ "$1" != "--run" ]; then
    echo -e "\e[32m1. Create Environment env...\e[0m"

    # Check if Python 3.10 is available
    if ! command -v python3.10 &> /dev/null
    then
        echo -e "\e[31mERROR: Python 3.10 is not available. Please install Python 3.10 and try again.\e[0m"
        exit 1
    fi

    # Check if the virtual environment already exists
    if [ -d "$ENV_NAME" ]; then
        echo -e "\e[33mWARNING: The virtual environment '$ENV_NAME' already exists.\e[0m"
        read -p "Do you want to remove it and create a new one? (y/n): " choice
        if [ "$choice" = "y" ]; then
            rm -rf $ENV_NAME
            echo -e "\e[33mThe existing virtual environment has been removed.\e[0m"
        else
            echo -e "\e[33mThe existing virtual environment will be used.\e[0m"
        fi
    else
        # Create a Python 3.10 virtual environment
        python3.10 -m venv $ENV_NAME
    fi
else
    echo -e "\e[33m1. Skipping environment installation.\e[0m"
fi



# -----------------------------------------------------------------------------------------------------------
# -----------------------------------------------------------------------------------------------------------
echo -e "\e[32m2. Activate Environment env...\e[0m"

# Activate the virtual environment
source $ENV_NAME/bin/activate

# Upgrade pip
pip install --upgrade pip


# -----------------------------------------------------------------------------------------------------------
# -----------------------------------------------------------------------------------------------------------
# Check if the script is run with a parameter
if [ "$1" != "--run" ]; then
    # -----------------------------------------------------------------------------------------------------------
    # -----------------------------------------------------------------------------------------------------------
    echo -e "\e[32m3. Install Requirements...\e[0m"

    # Install the dependencies from the requirements file
    pip install -r $REQUIREMENTS_FILE
    pip install git+https://github.com/facebookresearch/detectron2.git@main

    # Print a message indicating that the setup is complete
    echo -e "\e[32mVirtual environment '$ENV_NAME' created and dependencies installed.\e[0m"
else
    echo -e "\e[33m3. Skipping package installation.\e[0m"
fi

# -----------------------------------------------------------------------------------------------------------
# -----------------------------------------------------------------------------------------------------------
echo -e "\e[32m4. Run the compute node...\e[0m"
cd ../../instances/ComputeNode
python main_computenode.py